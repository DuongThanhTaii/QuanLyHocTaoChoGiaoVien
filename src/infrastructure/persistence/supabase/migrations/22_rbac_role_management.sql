-- Give role management its own permission.  `roles.assign` alone must never
-- allow an operator to manufacture a stronger role and then assign it.

BEGIN;

INSERT INTO public.permissions (code, name, module, description)
VALUES ('roles.manage', 'Quản lý vai trò', 'roles', 'Tạo và thay đổi vai trò tùy chỉnh')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  module = EXCLUDED.module,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code = 'roles.manage'
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

COMMIT;

NOTIFY pgrst, 'reload schema';
