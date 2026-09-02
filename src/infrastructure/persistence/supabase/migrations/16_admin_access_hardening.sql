-- Harden administration access. Apply this migration before exposing /admin.
BEGIN;

-- The canonical admin check comes from user_roles, never mutable auth metadata
-- or a client-writable profile field.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Prevent an authenticated browser session from changing the legacy role/status
-- fields. Trusted server actions use the service_role key for onboarding.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role'
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'role and status can only be changed by trusted server code';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_changes ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_changes();

-- user_roles is write-only for trusted server code. This removes the old policy
-- that allowed a user to insert or update their own role, including admin.
CREATE OR REPLACE FUNCTION public.prevent_untrusted_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'roles can only be changed by trusted server code';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS user_roles_prevent_untrusted_changes ON public.user_roles;
CREATE TRIGGER user_roles_prevent_untrusted_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_untrusted_role_changes();

DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_primary_per_user
  ON public.user_roles (user_id)
  WHERE is_primary;

DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;
CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
