-- Platform billing: plans, enforceable entitlements, PayOS orders and enterprise foundation.
-- Run after 19_admin_foundation_and_data_repair.sql.

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.billing_mode AS ENUM ('paid', 'free_access');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.billing_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  mode public.billing_mode NOT NULL DEFAULT 'paid',
  free_access_plan_code TEXT NOT NULL DEFAULT 'pro',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
INSERT INTO public.billing_settings (singleton, mode, free_access_plan_code)
VALUES (true, 'paid', 'pro') ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 100;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS plans_unique_code ON public.plans(code) WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  plan_id UUID PRIMARY KEY REFERENCES public.plans(id) ON DELETE CASCADE,
  max_classes INTEGER CHECK (max_classes IS NULL OR max_classes >= 0),
  max_students_per_class INTEGER CHECK (max_students_per_class IS NULL OR max_students_per_class >= 0),
  max_active_conversations INTEGER CHECK (max_active_conversations IS NULL OR max_active_conversations >= 0),
  max_storage_gb INTEGER CHECK (max_storage_gb IS NULL OR max_storage_gb >= 0),
  can_collect_tuition BOOLEAN NOT NULL DEFAULT false,
  can_advanced_analytics BOOLEAN NOT NULL DEFAULT false,
  can_custom_branding BOOLEAN NOT NULL DEFAULT false,
  can_priority_support BOOLEAN NOT NULL DEFAULT false,
  can_manage_team BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_price_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  interval public.plan_interval NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS plan_price_one_open_version
  ON public.plan_price_versions(plan_id, interval) WHERE effective_until IS NULL;
CREATE INDEX IF NOT EXISTS plan_price_current_lookup
  ON public.plan_price_versions(plan_id, interval, effective_from DESC);

-- Canonical plans. Existing rows are preserved; only these stable codes drive billing.
INSERT INTO public.plans (code, name, description, price_monthly, price_yearly, is_active, display_order, features)
VALUES
  ('free', 'Free', 'Dành cho giáo viên mới bắt đầu', 0, 0, true, 10, '{}'::jsonb),
  ('pro', 'Pro', 'Dành cho giáo viên chuyên nghiệp', 99000, 990000, true, 20, '{}'::jsonb),
  ('max', 'Max', 'Dành cho nhóm lớp có quy mô lớn', 249000, 2490000, true, 30, '{}'::jsonb),
  ('enterprise', 'Doanh nghiệp', 'Gói theo hợp đồng cho tổ chức đào tạo', 0, 0, true, 40, '{}'::jsonb)
ON CONFLICT (code) WHERE code IS NOT NULL DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly, is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order, updated_at = now();

INSERT INTO public.plan_entitlements (
  plan_id, max_classes, max_students_per_class, max_active_conversations, max_storage_gb,
  can_collect_tuition, can_advanced_analytics, can_custom_branding, can_priority_support, can_manage_team
)
SELECT p.id, v.max_classes, v.max_students_per_class, v.max_active_conversations, v.max_storage_gb,
       v.can_collect_tuition, v.can_advanced_analytics, v.can_custom_branding, v.can_priority_support, v.can_manage_team
FROM public.plans p
JOIN (VALUES
  ('free', 2, 30, 2, 1, false, false, false, false, false),
  ('pro', 12, 60, 20, 20, true, true, false, true, false),
  ('max', 40, 150, 100, 100, true, true, true, true, false),
  ('enterprise', 100, 500, 500, 1000, true, true, true, true, true)
) AS v(code, max_classes, max_students_per_class, max_active_conversations, max_storage_gb,
       can_collect_tuition, can_advanced_analytics, can_custom_branding, can_priority_support, can_manage_team)
ON p.code = v.code
ON CONFLICT (plan_id) DO UPDATE SET
  max_classes = EXCLUDED.max_classes, max_students_per_class = EXCLUDED.max_students_per_class,
  max_active_conversations = EXCLUDED.max_active_conversations, max_storage_gb = EXCLUDED.max_storage_gb,
  can_collect_tuition = EXCLUDED.can_collect_tuition, can_advanced_analytics = EXCLUDED.can_advanced_analytics,
  can_custom_branding = EXCLUDED.can_custom_branding, can_priority_support = EXCLUDED.can_priority_support,
  can_manage_team = EXCLUDED.can_manage_team, updated_at = now();

INSERT INTO public.plan_price_versions (plan_id, interval, amount)
SELECT p.id, v.interval::public.plan_interval, v.amount
FROM public.plans p
JOIN (VALUES
  ('free', 'monthly', 0::numeric), ('free', 'yearly', 0::numeric),
  ('pro', 'monthly', 99000::numeric), ('pro', 'yearly', 990000::numeric),
  ('max', 'monthly', 249000::numeric), ('max', 'yearly', 2490000::numeric)
) AS v(code, interval, amount) ON p.code = v.code
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_price_versions ppv
  WHERE ppv.plan_id = p.id AND ppv.interval = v.interval::public.plan_interval AND ppv.effective_until IS NULL
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS interval public.plan_interval;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_version_id UUID REFERENCES public.plan_price_versions(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'system';

CREATE TABLE IF NOT EXISTS public.platform_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  price_version_id UUID REFERENCES public.plan_price_versions(id) ON DELETE SET NULL,
  interval public.plan_interval NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired', 'failed', 'refunded')),
  order_code BIGINT NOT NULL UNIQUE,
  payos_payment_link_id TEXT UNIQUE,
  payos_checkout_url TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  price_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_orders_user_created ON public.platform_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS platform_orders_status_created ON public.platform_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL DEFAULT 'payos',
  event_hash TEXT NOT NULL UNIQUE,
  signature TEXT,
  payload JSONB NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  order_id UUID REFERENCES public.platform_orders(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks use this atomic operation so retries cannot activate a plan twice.
CREATE OR REPLACE FUNCTION public.activate_platform_order(target_order_code BIGINT, transaction_reference TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE order_row public.platform_orders%ROWTYPE; subscription_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO order_row FROM public.platform_orders WHERE order_code = target_order_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'platform order not found' USING ERRCODE = 'P0002'; END IF;
  IF order_row.status = 'paid' THEN
    SELECT id INTO subscription_id FROM public.subscriptions
    WHERE teacher_id = order_row.user_id AND plan_id = order_row.plan_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;
    RETURN subscription_id;
  END IF;
  IF order_row.status <> 'pending' THEN RAISE EXCEPTION 'order is not payable' USING ERRCODE = 'P0001'; END IF;

  UPDATE public.subscriptions
  SET status = 'cancelled', updated_at = now()
  WHERE teacher_id = order_row.user_id AND status IN ('active', 'trial');

  INSERT INTO public.subscriptions (
    teacher_id, plan_id, status, current_period_start, current_period_end,
    cancel_at_period_end, interval, price_version_id, source
  ) VALUES (
    order_row.user_id, order_row.plan_id, 'active', now(),
    now() + CASE WHEN order_row.interval = 'yearly' THEN interval '1 year' ELSE interval '1 month' END,
    false, order_row.interval, order_row.price_version_id, 'payos'
  ) RETURNING id INTO subscription_id;

  UPDATE public.platform_orders
  SET status = 'paid', payment_reference = transaction_reference, paid_at = now(), updated_at = now()
  WHERE id = order_row.id;

  INSERT INTO public.subscription_events (subscription_id, user_id, event_type, order_id, metadata)
  VALUES (subscription_id, order_row.user_id, 'activated', order_row.id,
          jsonb_build_object('gateway', 'payos', 'transaction_reference', transaction_reference));
  RETURN subscription_id;
END;
$$;

-- Enterprise groundwork. Entitlements remain explicit rather than "unlimited".
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'suspended', 'closed')),
  contract_ends_at TIMESTAMPTZ,
  entitlement_override JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'teacher', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE OR REPLACE FUNCTION public.get_effective_entitlement(target_user_id UUID)
RETURNS TABLE (
  plan_code TEXT, max_classes INTEGER, max_students_per_class INTEGER,
  max_active_conversations INTEGER, max_storage_gb INTEGER,
  can_collect_tuition BOOLEAN, can_advanced_analytics BOOLEAN,
  can_custom_branding BOOLEAN, can_priority_support BOOLEAN, can_manage_team BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH selected_plan AS (
    SELECT p.id, p.code
    FROM public.billing_settings bs
    JOIN public.plans p ON p.code = CASE
      WHEN bs.mode = 'free_access' THEN bs.free_access_plan_code
      ELSE COALESCE((
        SELECT paid_plan.code
        FROM public.subscriptions s
        JOIN public.plans paid_plan ON paid_plan.id = s.plan_id
        WHERE s.teacher_id = target_user_id
          AND s.status IN ('active', 'trial')
          AND ((s.status = 'trial' AND s.trial_ends_at > now()) OR (s.status = 'active' AND s.current_period_end > now()))
        ORDER BY s.current_period_end DESC NULLS LAST, s.created_at DESC
        LIMIT 1
      ), 'free')
    END
    LIMIT 1
  )
  SELECT sp.code, pe.max_classes, pe.max_students_per_class, pe.max_active_conversations, pe.max_storage_gb,
         pe.can_collect_tuition, pe.can_advanced_analytics, pe.can_custom_branding, pe.can_priority_support, pe.can_manage_team
  FROM selected_plan sp JOIN public.plan_entitlements pe ON pe.plan_id = sp.id;
$$;

CREATE OR REPLACE FUNCTION public.assert_billing_quota(target_user_id UUID, quota TEXT, target_class_id UUID DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE limit_value INTEGER; current_value INTEGER;
BEGIN
  IF quota = 'classes' THEN
    SELECT max_classes INTO limit_value FROM public.get_effective_entitlement(target_user_id);
    SELECT count(*) INTO current_value FROM public.classes WHERE teacher_id = target_user_id AND is_active;
    IF limit_value IS NOT NULL AND current_value >= limit_value THEN RAISE EXCEPTION 'Bạn đã đạt giới hạn % lớp học của gói hiện tại.', limit_value USING ERRCODE = 'P0001'; END IF;
  ELSIF quota = 'students_per_class' THEN
    SELECT max_students_per_class INTO limit_value FROM public.get_effective_entitlement(target_user_id);
    SELECT count(*) INTO current_value FROM public.enrollments WHERE class_id = target_class_id AND status = 'ACTIVE';
    IF limit_value IS NOT NULL AND current_value >= limit_value THEN RAISE EXCEPTION 'Lớp học đã đạt giới hạn % học sinh của gói hiện tại.', limit_value USING ERRCODE = 'P0001'; END IF;
  ELSIF quota = 'conversations' THEN
    SELECT max_active_conversations INTO limit_value FROM public.get_effective_entitlement(target_user_id);
    SELECT count(*) INTO current_value FROM public.conversations WHERE created_by = target_user_id AND COALESCE(is_archived, false) = false;
    IF limit_value IS NOT NULL AND current_value >= limit_value THEN RAISE EXCEPTION 'Bạn đã đạt giới hạn % đoạn chat đang hoạt động của gói hiện tại.', limit_value USING ERRCODE = 'P0001'; END IF;
  ELSE RAISE EXCEPTION 'Unknown quota %', quota USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_class_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN PERFORM public.assert_billing_quota(NEW.teacher_id, 'classes'); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS classes_enforce_billing_quota ON public.classes;
CREATE TRIGGER classes_enforce_billing_quota BEFORE INSERT ON public.classes FOR EACH ROW EXECUTE FUNCTION public.enforce_class_quota();

CREATE OR REPLACE FUNCTION public.enforce_enrollment_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE class_teacher_id UUID;
BEGIN
  IF NEW.status = 'ACTIVE' AND (TG_OP = 'INSERT' OR OLD.status <> 'ACTIVE' OR OLD.class_id <> NEW.class_id) THEN
    SELECT teacher_id INTO class_teacher_id FROM public.classes WHERE id = NEW.class_id;
    PERFORM public.assert_billing_quota(class_teacher_id, 'students_per_class', NEW.class_id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enrollments_enforce_billing_quota ON public.enrollments;
CREATE TRIGGER enrollments_enforce_billing_quota BEFORE INSERT OR UPDATE OF status, class_id ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.enforce_enrollment_quota();

CREATE OR REPLACE FUNCTION public.enforce_conversation_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_archived, false) = false
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.is_archived, false) = true) THEN
    PERFORM public.assert_billing_quota(NEW.created_by, 'conversations');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS conversations_enforce_billing_quota ON public.conversations;
CREATE TRIGGER conversations_enforce_billing_quota BEFORE INSERT OR UPDATE OF is_archived ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.enforce_conversation_quota();

ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans" ON public.plans FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "Authenticated can read plan entitlements" ON public.plan_entitlements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read current plan prices" ON public.plan_price_versions FOR SELECT TO authenticated USING (effective_from <= now() AND (effective_until IS NULL OR effective_until > now()));
CREATE POLICY "Users can read own platform orders" ON public.platform_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can read own subscription events" ON public.subscription_events FOR SELECT TO authenticated USING (user_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.get_effective_entitlement(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.assert_billing_quota(UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_platform_order(BIGINT, TEXT) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
