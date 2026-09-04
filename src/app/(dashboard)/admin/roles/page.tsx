import { AdminAuthorizationError, requireAdminPermission } from '@/lib/admin/server';
import { getActiveRoleAssignments, getAdminRoleRegistry, getAssignableAdminUsers } from '@/lib/admin/roles';
import { RoleManager } from './RoleManager';

async function hasPermission(permission: 'roles.assign' | 'roles.manage') {
  try {
    await requireAdminPermission(permission);
    return true;
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return false;
    throw error;
  }
}

export default async function RolesPage() {
  const [registry, assignments, canAssign, canManage] = await Promise.all([
    getAdminRoleRegistry(),
    getActiveRoleAssignments(),
    hasPermission('roles.assign'),
    hasPermission('roles.manage'),
  ]);
  const users = canAssign ? await getAssignableAdminUsers() : [];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight">Vai trò & quyền</h1><p className="mt-1 text-sm text-muted-foreground">Quyền được đọc từ database và được API kiểm tra theo từng hành động.</p></div>
    <RoleManager {...registry} assignments={assignments} users={users} canAssign={canAssign} canManage={canManage} />
  </div>;
}
