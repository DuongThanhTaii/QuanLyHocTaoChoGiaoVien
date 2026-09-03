'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminPermission, writeAdminAuditLog } from '@/lib/admin/server';

const RestrictionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['suspension', 'ban']),
  reason: z.string().trim().min(3).max(500),
  endsAt: z.string().datetime().optional().or(z.literal('')),
});

export async function restrictUser(formData: FormData): Promise<void> {
  const parsed = RestrictionSchema.safeParse({
    userId: formData.get('userId'), type: formData.get('type'), reason: formData.get('reason'), endsAt: formData.get('endsAt'),
  });
  if (!parsed.success) throw new Error('Dữ liệu khóa tài khoản không hợp lệ.');

  try {
    const { user: actor, admin } = await requireAdminPermission('users.restrict');
    const endsAt = parsed.data.endsAt || null;
    const { data: targetSuperAdmin } = await admin.from('user_role_assignments')
      .select('id, roles!user_role_assignments_role_id_fkey!inner(code)')
      .eq('user_id', parsed.data.userId).is('revoked_at', null).eq('roles.code', 'super_admin').maybeSingle();
    if (targetSuperAdmin) throw new Error('Không thể khóa tài khoản đang có vai trò Super admin.');

    const { data: previous } = await admin.from('account_restrictions').select('id, type, ends_at').eq('user_id', parsed.data.userId).is('revoked_at', null).maybeSingle();
    if (previous) throw new Error('Tài khoản này đang bị hạn chế. Hãy mở khóa trước khi tạo restriction mới.');

    const { error } = await admin.from('account_restrictions').insert({
      user_id: parsed.data.userId, type: parsed.data.type, reason: parsed.data.reason, ends_at: endsAt, created_by: actor.id,
    });
    if (error) throw new Error(error.message);

    const banDuration = endsAt ? `${Math.max(1, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 3_600_000))}h` : '876000h';
    const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.userId, { ban_duration: banDuration });
    if (authError) throw new Error(authError.message);

    await writeAdminAuditLog(admin, { actorId: actor.id, action: 'users.restrict', resourceType: 'user', resourceId: parsed.data.userId, reason: parsed.data.reason, afterState: { type: parsed.data.type, endsAt } });
    revalidatePath('/admin'); revalidatePath('/admin/users');
    return;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể khóa tài khoản.');
  }
}

export async function removeRestriction(formData: FormData): Promise<void> {
  const userId = z.string().uuid().safeParse(formData.get('userId'));
  if (!userId.success) throw new Error('Tài khoản không hợp lệ.');
  try {
    const { user: actor, admin } = await requireAdminPermission('users.restrict');
    const { data: previous, error: findError } = await admin.from('account_restrictions').select('id, type, reason, ends_at').eq('user_id', userId.data).is('revoked_at', null).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!previous) throw new Error('Tài khoản này không bị hạn chế.');
    const { error } = await admin.from('account_restrictions').update({ revoked_at: new Date().toISOString(), revoked_by: actor.id, revoke_reason: 'Mở khóa bởi admin' }).eq('id', previous.id);
    if (error) throw new Error(error.message);
    const { error: authError } = await admin.auth.admin.updateUserById(userId.data, { ban_duration: 'none' });
    if (authError) throw new Error(authError.message);
    await writeAdminAuditLog(admin, { actorId: actor.id, action: 'users.unrestrict', resourceType: 'user', resourceId: userId.data, beforeState: previous });
    revalidatePath('/admin'); revalidatePath('/admin/users');
    return;
  } catch (error) { throw new Error(error instanceof Error ? error.message : 'Không thể mở khóa tài khoản.'); }
}
