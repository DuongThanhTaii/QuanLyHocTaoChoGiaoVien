'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminPermission, writeAdminAuditLog } from '@/lib/admin/server';

export type RoleActionState = { error?: string; success?: string };

const CreateRoleSchema = z.object({
  code: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  permissionIds: z.array(z.string().uuid()).min(1),
});

const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

const RevokeRoleSchema = z.object({ assignmentId: z.string().uuid() });

async function actorCanManageRole(
  admin: Awaited<ReturnType<typeof requireAdminPermission>>['admin'],
  actorId: string,
  roleId: string,
) {
  const { data: legacyAdmin } = await admin.from('user_roles')
    .select('user_id')
    .eq('user_id', actorId)
    .eq('role', 'admin')
    .maybeSingle();
  if (legacyAdmin) return true;

  const [{ data: actorAssignments, error: assignmentError }, { data: rolePermissions, error: roleError }] = await Promise.all([
    admin.from('user_role_assignments').select('role_id, roles!user_role_assignments_role_id_fkey(code)')
      .eq('user_id', actorId).is('revoked_at', null).lte('starts_at', new Date().toISOString())
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    admin.from('role_permissions').select('permission_id').eq('role_id', roleId),
  ]);
  if (assignmentError || roleError) throw new Error(assignmentError?.message ?? roleError?.message ?? 'Không thể kiểm tra quyền gán role.');

  const isSuperAdmin = (actorAssignments ?? []).some((assignment) => {
    const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
    return role?.code === 'super_admin';
  });
  if (isSuperAdmin) return true;

  const actorRoleIds = (actorAssignments ?? []).map((assignment) => assignment.role_id);
  if (!actorRoleIds.length) return false;
  const { data: actorRolePermissions, error: actorPermissionsError } = await admin
    .from('role_permissions')
    .select('permission_id')
    .in('role_id', actorRoleIds);
  if (actorPermissionsError) throw new Error(actorPermissionsError.message);

  const actorPermissionIds = new Set((actorRolePermissions ?? []).map((permission) => permission.permission_id));
  return (rolePermissions ?? []).every((permission) => actorPermissionIds.has(permission.permission_id));
}

export async function createRole(_previous: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const parsed = CreateRoleSchema.safeParse({
    code: String(formData.get('code') ?? '').trim().toLowerCase(),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    permissionIds: formData.getAll('permissionIds'),
  });
  if (!parsed.success) return { error: 'Kiểm tra lại mã, tên vai trò và ít nhất một quyền được chọn.' };

  try {
    const { user: actor, admin } = await requireAdminPermission('roles.manage');
    const { data: permissions, error: permissionError } = await admin.from('permissions').select('id').in('id', parsed.data.permissionIds);
    if (permissionError || permissions?.length !== new Set(parsed.data.permissionIds).size) throw new Error('Có quyền không tồn tại hoặc đã bị xóa.');

    const { data: role, error: roleError } = await admin.from('roles').insert({
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      is_system: false,
      is_active: true,
    }).select('id, code, name').single();
    if (roleError) {
      if (roleError.code === '23505') return { error: 'Mã vai trò này đã tồn tại.' };
      throw new Error(roleError.message);
    }

    const { error: mappingError } = await admin.from('role_permissions').insert(
      parsed.data.permissionIds.map((permissionId) => ({ role_id: role.id, permission_id: permissionId })),
    );
    if (mappingError) throw new Error(mappingError.message);

    await writeAdminAuditLog(admin, {
      actorId: actor.id,
      action: 'roles.create',
      resourceType: 'role',
      resourceId: role.id,
      afterState: { code: role.code, name: role.name, permissionIds: parsed.data.permissionIds },
    });
    revalidatePath('/admin/roles');
    return { success: `Đã tạo vai trò ${role.name}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không thể tạo vai trò.' };
  }
}

export async function assignRole(_previous: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const parsed = AssignRoleSchema.safeParse({ userId: formData.get('userId'), roleId: formData.get('roleId'), reason: formData.get('reason') || undefined });
  if (!parsed.success) return { error: 'Hãy chọn người dùng và vai trò hợp lệ.' };

  try {
    const { user: actor, admin } = await requireAdminPermission('roles.assign');
    if (actor.id === parsed.data.userId) return { error: 'Không thể tự cấp vai trò cho chính mình.' };
    if (!await actorCanManageRole(admin, actor.id, parsed.data.roleId)) return { error: 'Bạn không thể gán vai trò có quyền cao hơn quyền hiện có của mình.' };

    const { data: role, error: roleError } = await admin.from('roles').select('id, name, code, is_active').eq('id', parsed.data.roleId).maybeSingle();
    if (roleError || !role?.is_active) return { error: 'Vai trò không tồn tại hoặc đã ngừng hoạt động.' };
    const { data: target } = await admin.auth.admin.getUserById(parsed.data.userId);
    if (!target.user) return { error: 'Không tìm thấy người dùng.' };

    const { data: existing, error: existingError } = await admin.from('user_role_assignments').select('id').eq('user_id', parsed.data.userId).eq('role_id', parsed.data.roleId).is('revoked_at', null).maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return { error: 'Người dùng này đã có vai trò đang hiệu lực hoặc chưa được thu hồi.' };

    const { data: assignment, error: insertError } = await admin.from('user_role_assignments').insert({
      user_id: parsed.data.userId, role_id: parsed.data.roleId, assigned_by: actor.id, reason: parsed.data.reason ?? null,
    }).select('id').single();
    if (insertError) throw new Error(insertError.message);

    await writeAdminAuditLog(admin, { actorId: actor.id, action: 'roles.assign', resourceType: 'user_role_assignment', resourceId: assignment.id, reason: parsed.data.reason, afterState: { userId: parsed.data.userId, role: role.code } });
    revalidatePath('/admin/roles'); revalidatePath('/admin/users'); revalidatePath('/admin');
    return { success: `Đã gán ${role.name} cho ${target.user.email ?? 'người dùng'}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không thể gán vai trò.' };
  }
}

export async function revokeRole(_previous: RoleActionState, formData: FormData): Promise<RoleActionState> {
  const parsed = RevokeRoleSchema.safeParse({ assignmentId: formData.get('assignmentId') });
  if (!parsed.success) return { error: 'Vai trò cần thu hồi không hợp lệ.' };

  try {
    const { user: actor, admin } = await requireAdminPermission('roles.assign');
    const { data: assignment, error: findError } = await admin.from('user_role_assignments')
      .select('id, user_id, role_id, roles!user_role_assignments_role_id_fkey(code, name)')
      .eq('id', parsed.data.assignmentId).is('revoked_at', null).maybeSingle();
    if (findError || !assignment) return { error: 'Vai trò này không còn hiệu lực.' };
    if (assignment.user_id === actor.id) return { error: 'Không thể tự thu hồi vai trò của chính mình.' };
    if (!await actorCanManageRole(admin, actor.id, assignment.role_id)) return { error: 'Bạn không thể thu hồi vai trò có quyền cao hơn quyền hiện có của mình.' };

    const assignedRole = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
    if (assignedRole?.code === 'super_admin') {
      const { count, error: countError } = await admin.from('user_role_assignments')
        .select('id, roles!user_role_assignments_role_id_fkey!inner(code)', { count: 'exact', head: true })
        .eq('roles.code', 'super_admin').is('revoked_at', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      if (countError) throw new Error(countError.message);
      if ((count ?? 0) <= 1) return { error: 'Không thể thu hồi Super admin cuối cùng.' };
    }

    const { error: revokeError } = await admin.from('user_role_assignments').update({ revoked_at: new Date().toISOString(), revoked_by: actor.id }).eq('id', assignment.id);
    if (revokeError) throw new Error(revokeError.message);
    await writeAdminAuditLog(admin, { actorId: actor.id, action: 'roles.revoke', resourceType: 'user_role_assignment', resourceId: assignment.id, beforeState: { userId: assignment.user_id, role: assignedRole?.code } });
    revalidatePath('/admin/roles'); revalidatePath('/admin/users'); revalidatePath('/admin');
    return { success: `Đã thu hồi ${assignedRole?.name ?? 'vai trò'}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không thể thu hồi vai trò.' };
  }
}
