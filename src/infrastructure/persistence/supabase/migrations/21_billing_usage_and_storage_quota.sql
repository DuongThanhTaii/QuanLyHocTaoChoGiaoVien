-- Usage snapshot and storage enforcement for teacher billing quotas.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_billing_usage(target_user_id UUID)
RETURNS TABLE (
  active_classes INTEGER,
  active_conversations INTEGER,
  storage_bytes BIGINT,
  peak_class_name TEXT,
  peak_class_students INTEGER,
  max_classes INTEGER,
  max_students_per_class INTEGER,
  max_active_conversations INTEGER,
  max_storage_gb INTEGER
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE entitlement RECORD;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() IS DISTINCT FROM target_user_id THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO entitlement FROM public.get_effective_entitlement(target_user_id);

  RETURN QUERY
  WITH class_usage AS (
    SELECT count(*)::INTEGER AS total FROM public.classes
    WHERE teacher_id = target_user_id AND is_active
  ), conversation_usage AS (
    SELECT count(*)::INTEGER AS total FROM public.conversations
    WHERE created_by = target_user_id AND COALESCE(is_archived, false) = false
  ), storage_usage AS (
    SELECT COALESCE(sum(item.size_bytes), 0)::BIGINT AS total
    FROM (
      SELECT DISTINCT ON (m.storage_path) COALESCE(m.size_bytes, 0)::BIGINT AS size_bytes
      FROM public.materials m
      JOIN public.classes c ON c.id = m.class_id
      WHERE c.teacher_id = target_user_id
        AND m.uploaded_by = target_user_id
        AND m.storage_path IS NOT NULL
      ORDER BY m.storage_path, m.created_at ASC
    ) AS item
  ), peak_class AS (
    SELECT c.name, count(e.id)::INTEGER AS students
    FROM public.classes c
    LEFT JOIN public.enrollments e ON e.class_id = c.id AND e.status = 'ACTIVE'
    WHERE c.teacher_id = target_user_id AND c.is_active
    GROUP BY c.id, c.name
    ORDER BY count(e.id) DESC, c.created_at ASC
    LIMIT 1
  )
  SELECT class_usage.total, conversation_usage.total, storage_usage.total,
         peak_class.name, peak_class.students,
         entitlement.max_classes, entitlement.max_students_per_class,
         entitlement.max_active_conversations, entitlement.max_storage_gb
  FROM class_usage CROSS JOIN conversation_usage CROSS JOIN storage_usage
  LEFT JOIN peak_class ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_billing_storage_quota(
  target_user_id UUID,
  new_storage_path TEXT,
  new_size_bytes BIGINT,
  exclude_material_id UUID DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE limit_gb INTEGER; used_bytes BIGINT; limit_bytes BIGINT;
BEGIN
  SELECT max_storage_gb INTO limit_gb FROM public.get_effective_entitlement(target_user_id);
  IF limit_gb IS NULL OR new_storage_path IS NULL THEN RETURN; END IF;

  -- Reassigning the same Drive file does not consume storage twice.
  IF EXISTS (
    SELECT 1 FROM public.materials
    WHERE uploaded_by = target_user_id AND storage_path = new_storage_path
      AND (exclude_material_id IS NULL OR id <> exclude_material_id)
  ) THEN RETURN; END IF;

  SELECT COALESCE(sum(item.size_bytes), 0)::BIGINT INTO used_bytes
  FROM (
    SELECT DISTINCT ON (m.storage_path) COALESCE(m.size_bytes, 0)::BIGINT AS size_bytes
    FROM public.materials m
    JOIN public.classes c ON c.id = m.class_id
    WHERE c.teacher_id = target_user_id
      AND m.uploaded_by = target_user_id
      AND m.storage_path IS NOT NULL
      AND (exclude_material_id IS NULL OR m.id <> exclude_material_id)
    ORDER BY m.storage_path, m.created_at ASC
  ) AS item;

  limit_bytes := limit_gb::BIGINT * 1024 * 1024 * 1024;
  IF used_bytes + GREATEST(COALESCE(new_size_bytes, 0), 0) > limit_bytes THEN
    RAISE EXCEPTION 'Bạn đã đạt giới hạn % GB dung lượng của gói hiện tại.', limit_gb USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_storage_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id UUID;
BEGIN
  SELECT teacher_id INTO owner_id FROM public.classes WHERE id = NEW.class_id;
  IF owner_id IS NOT NULL AND NEW.uploaded_by = owner_id THEN
    PERFORM public.assert_billing_storage_quota(owner_id, NEW.storage_path, NEW.size_bytes, CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END);
  END IF;
  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS materials_uploaded_storage_path_idx
  ON public.materials(uploaded_by, storage_path) WHERE storage_path IS NOT NULL;

DROP TRIGGER IF EXISTS materials_enforce_storage_quota ON public.materials;
CREATE TRIGGER materials_enforce_storage_quota
  BEFORE INSERT OR UPDATE OF class_id, uploaded_by, storage_path, size_bytes ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_storage_quota();

GRANT EXECUTE ON FUNCTION public.get_billing_usage(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assert_billing_storage_quota(UUID, TEXT, BIGINT, UUID) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
