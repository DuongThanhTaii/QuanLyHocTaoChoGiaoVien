-- Administration foundation and safe identity-data repair.
-- This migration is intentionally additive: it preserves the existing
-- user_roles table while moving platform administration to dynamic roles.

BEGIN;

-- 1. Dynamic RBAC -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_]{1,63}$'),
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_.]{1,127}$'),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_role_assignments_one_active_role
  ON public.user_role_assignments(user_id, role_id)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS user_role_assignments_effective_lookup
  ON public.user_role_assignments(user_id, starts_at, expires_at)
  WHERE revoked_at IS NULL;

-- 2. Account restrictions and immutable operational history ----------------

CREATE TABLE IF NOT EXISTS public.account_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('suspension', 'ban')),
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 3),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS account_restrictions_one_active_per_user
  ON public.account_restrictions(user_id)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS account_restrictions_effective_lookup
  ON public.account_restrictions(user_id, starts_at, ends_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action ~ '^[a-z][a-z0-9_.]{1,127}$'),
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure')),
  reason TEXT,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_created_at ON public.admin_audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_resource ON public.admin_audit_logs(resource_type, resource_id, created_at DESC);

-- Audit history must never be altered through the client role.
CREATE OR REPLACE FUNCTION public.prevent_admin_audit_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'audit log is append-only';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS admin_audit_logs_append_only ON public.admin_audit_logs;
CREATE TRIGGER admin_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_audit_mutation();

-- 3. Seed system roles and permissions --------------------------------------

INSERT INTO public.roles (code, name, description, is_system)
VALUES
  ('super_admin', 'Super admin', 'Toàn quyền quản trị nền tảng', true),
  ('operations_admin', 'Operations admin', 'Vận hành người dùng và dữ liệu', true),
  ('billing_admin', 'Billing admin', 'Quản lý gói cước và subscription', true),
  ('support_agent', 'Support agent', 'Tra cứu và hỗ trợ, không thay đổi quyền', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = true,
  updated_at = now();

INSERT INTO public.permissions (code, name, module, description)
VALUES
  ('users.read', 'Xem người dùng', 'users', 'Tra cứu hồ sơ và trạng thái tài khoản'),
  ('users.restrict', 'Khóa hoặc ban người dùng', 'users', 'Tạo hoặc thu hồi restriction'),
  ('roles.read', 'Xem quyền', 'roles', 'Xem vai trò và quyền'),
  ('roles.assign', 'Gán quyền', 'roles', 'Gán hoặc thu hồi role động'),
  ('plans.read', 'Xem gói cước', 'plans', 'Xem cấu hình plan'),
  ('plans.manage', 'Quản lý gói cước', 'plans', 'Tạo và thay đổi plan/giá'),
  ('subscriptions.read', 'Xem subscription', 'subscriptions', 'Tra cứu subscription'),
  ('subscriptions.manage', 'Quản lý subscription', 'subscriptions', 'Gia hạn trial, override và hủy'),
  ('billing.manage', 'Cấu hình billing', 'billing', 'Bật/tắt billing và cấu hình thu phí'),
  ('audit.read', 'Xem audit log', 'audit', 'Tra cứu nhật ký quản trị'),
  ('system.read', 'Xem vận hành', 'system', 'Xem dashboard và trạng thái hệ thống')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  module = EXCLUDED.module,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN ('users.read', 'users.restrict', 'roles.read', 'audit.read', 'system.read')
WHERE r.code = 'operations_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN ('plans.read', 'plans.manage', 'subscriptions.read', 'subscriptions.manage', 'billing.manage', 'audit.read', 'system.read')
WHERE r.code = 'billing_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions(role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN ('users.read', 'roles.read', 'subscriptions.read', 'audit.read')
WHERE r.code = 'support_agent'
ON CONFLICT DO NOTHING;

-- 4. Safe repair of existing identity data ---------------------------------
-- Missing profiles can occur if the auth trigger failed. Missing persona roles
-- are repaired from legacy profiles.role; the fallback is teacher to preserve
-- the historical application behaviour.
INSERT INTO public.profiles (id, email, full_name, status)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1)),
  'ONBOARDING'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL AND u.email IS NOT NULL;

-- This is migration-only repair; existing hardening prevents browser clients
-- from changing roles, so temporarily disable the trusted-code trigger.
ALTER TABLE public.user_roles DISABLE TRIGGER user_roles_prevent_untrusted_changes;

INSERT INTO public.user_roles (user_id, role, is_primary)
SELECT p.id, COALESCE(p.role, 'teacher'::public.user_role), true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Repair profiles with several historical roles but no declared primary.
WITH ranked_roles AS (
  SELECT user_id, role,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at, role) AS position
  FROM public.user_roles
), missing_primary AS (
  SELECT DISTINCT ur.user_id
  FROM public.user_roles ur
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles primary_role
    WHERE primary_role.user_id = ur.user_id AND primary_role.is_primary
  )
)
UPDATE public.user_roles ur
SET is_primary = (ranked_roles.position = 1)
FROM ranked_roles
JOIN missing_primary mp ON mp.user_id = ranked_roles.user_id
WHERE ur.user_id = ranked_roles.user_id AND ur.role = ranked_roles.role;

ALTER TABLE public.user_roles ENABLE TRIGGER user_roles_prevent_untrusted_changes;

-- Existing admins receive the dynamic super_admin role. This is additive and
-- makes no assumptions about non-admin accounts.
INSERT INTO public.user_role_assignments (user_id, role_id, reason)
SELECT ur.user_id, r.id, 'Migrated from legacy admin role'
FROM public.user_roles ur
JOIN public.roles r ON r.code = 'super_admin'
WHERE ur.role = 'admin'
ON CONFLICT (user_id, role_id) WHERE revoked_at IS NULL DO NOTHING;

-- 5. Authorisation helpers and RLS -----------------------------------------

CREATE OR REPLACE FUNCTION public.has_permission(permission_code TEXT)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.roles r ON r.id = ura.role_id
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ura.user_id = auth.uid()
      AND ura.revoked_at IS NULL
      AND ura.starts_at <= now()
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND r.is_active
      AND p.code = permission_code
  );
$$;

CREATE OR REPLACE FUNCTION public.is_account_restricted(target_user_id UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_restrictions ar
    WHERE ar.user_id = target_user_id
      AND ar.revoked_at IS NULL
      AND ar.starts_at <= now()
      AND (ar.ends_at IS NULL OR ar.ends_at > now())
  );
$$;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read active roles" ON public.roles;
CREATE POLICY "Authenticated can read active roles" ON public.roles
  FOR SELECT TO authenticated USING (is_active OR public.has_permission('roles.read'));
DROP POLICY IF EXISTS "Role readers can read permissions" ON public.permissions;
CREATE POLICY "Role readers can read permissions" ON public.permissions
  FOR SELECT TO authenticated USING (public.has_permission('roles.read'));
DROP POLICY IF EXISTS "Role readers can read role permissions" ON public.role_permissions;
CREATE POLICY "Role readers can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (public.has_permission('roles.read'));
DROP POLICY IF EXISTS "Users can read own role assignments" ON public.user_role_assignments;
CREATE POLICY "Users can read own role assignments" ON public.user_role_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_permission('roles.read'));
DROP POLICY IF EXISTS "Operations can read restrictions" ON public.account_restrictions;
CREATE POLICY "Operations can read restrictions" ON public.account_restrictions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_permission('users.read'));
DROP POLICY IF EXISTS "Auditors can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Auditors can read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated USING (public.has_permission('audit.read'));

REVOKE ALL ON FUNCTION public.has_permission(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_account_restricted(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_account_restricted(UUID) TO authenticated, service_role;

COMMIT;
