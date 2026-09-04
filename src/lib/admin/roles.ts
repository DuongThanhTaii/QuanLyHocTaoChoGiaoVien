import { requireAdminPermission } from './server';

export type AdminPermissionRecord = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
};

export type AdminRoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissions: string[];
};

export type AssignableAdminUser = {
  id: string;
  email: string;
  fullName: string;
};

export type ActiveRoleAssignment = {
  id: string;
  userId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
};

export async function getAdminRoleRegistry(): Promise<{
  roles: AdminRoleRecord[];
  permissions: AdminPermissionRecord[];
}> {
  const { admin } = await requireAdminPermission('roles.read');
  const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
    admin.from('roles').select('id, code, name, description, is_system, is_active').order('is_system', { ascending: false }).order('name'),
    admin.from('permissions').select('id, code, name, module, description').order('module').order('name'),
    admin.from('role_permissions').select('role_id, permissions!role_permissions_permission_id_fkey(code)'),
  ]);

  for (const result of [rolesResult, permissionsResult, rolePermissionsResult]) {
    if (result.error) throw new Error(`Không thể đọc dữ liệu phân quyền: ${result.error.message}`);
  }

  const permissionCodesByRole = new Map<string, string[]>();
  for (const row of rolePermissionsResult.data ?? []) {
    const permission = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
    if (!permission?.code) continue;
    permissionCodesByRole.set(row.role_id, [...(permissionCodesByRole.get(row.role_id) ?? []), permission.code]);
  }

  return {
    roles: (rolesResult.data ?? []).map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.is_system,
      isActive: role.is_active,
      permissions: permissionCodesByRole.get(role.id) ?? [],
    })),
    permissions: permissionsResult.data ?? [],
  };
}

export async function getAssignableAdminUsers(): Promise<AssignableAdminUser[]> {
  const { admin } = await requireAdminPermission('roles.assign');
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`Không thể đọc danh sách người dùng: ${error.message}`);

  return (data.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? 'Không có email',
    fullName: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user.email ?? 'Chưa có hồ sơ',
  })).sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
}

export async function getActiveRoleAssignments(): Promise<ActiveRoleAssignment[]> {
  const { admin } = await requireAdminPermission('roles.read');
  const [{ data: assignments, error: assignmentsError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.from('user_role_assignments')
      .select('id, user_id, role_id, created_at, roles!user_role_assignments_role_id_fkey(code, name)')
      .is('revoked_at', null)
      .lte('starts_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, full_name, email'),
  ]);
  if (assignmentsError || profilesError) throw new Error(assignmentsError?.message ?? profilesError?.message ?? 'Không thể đọc vai trò đang được cấp.');

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return (assignments ?? []).flatMap((assignment) => {
    const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
    if (!role) return [];
    const profile = profilesById.get(assignment.user_id);
    return [{
      id: assignment.id,
      userId: assignment.user_id,
      roleId: assignment.role_id,
      roleCode: role.code,
      roleName: role.name,
      userName: profile?.full_name ?? profile?.email ?? 'Chưa có hồ sơ',
      userEmail: profile?.email ?? '',
      assignedAt: assignment.created_at,
    }];
  });
}
