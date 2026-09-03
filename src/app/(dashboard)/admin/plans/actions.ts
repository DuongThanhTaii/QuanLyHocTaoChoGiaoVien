'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminPermission, writeAdminAuditLog } from '@/lib/admin/server';

const PlanSchema = z.object({
  planId: z.string().uuid(), name: z.string().trim().min(2).max(80), description: z.string().trim().max(300),
  monthlyPrice: z.coerce.number().int().min(0), yearlyPrice: z.coerce.number().int().min(0),
  maxClasses: z.coerce.number().int().min(0).max(10000), maxStudentsPerClass: z.coerce.number().int().min(0).max(100000),
  maxActiveConversations: z.coerce.number().int().min(0).max(100000), maxStorageGb: z.coerce.number().int().min(0).max(100000),
  isActive: z.enum(['true', 'false']),
});

export async function updateBillingMode(formData: FormData) {
  const mode = z.enum(['paid', 'free_access']).safeParse(formData.get('mode'));
  if (!mode.success) throw new Error('Chế độ billing không hợp lệ.');
  const { user, admin } = await requireAdminPermission('billing.manage');
  const { error } = await admin.from('billing_settings').update({ mode: mode.data, updated_by: user.id, updated_at: new Date().toISOString() }).eq('singleton', true);
  if (error) throw new Error(error.message);
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'billing.toggle', resourceType: 'billing_settings', afterState: { mode: mode.data } });
  revalidatePath('/admin'); revalidatePath('/admin/plans'); revalidatePath('/pricing');
}

export async function updatePlan(formData: FormData) {
  const input = PlanSchema.safeParse({
    planId: formData.get('planId'), name: formData.get('name'), description: formData.get('description') || '',
    monthlyPrice: formData.get('monthlyPrice'), yearlyPrice: formData.get('yearlyPrice'), maxClasses: formData.get('maxClasses'),
    maxStudentsPerClass: formData.get('maxStudentsPerClass'), maxActiveConversations: formData.get('maxActiveConversations'), maxStorageGb: formData.get('maxStorageGb'), isActive: formData.get('isActive') || 'false',
  });
  if (!input.success) throw new Error('Dữ liệu gói không hợp lệ.');
  const { user, admin } = await requireAdminPermission('plans.manage');
  const value = input.data;
  const [{ error: planError }, { error: entitlementError }] = await Promise.all([
    admin.from('plans').update({ name: value.name, description: value.description || null, price_monthly: value.monthlyPrice, price_yearly: value.yearlyPrice, is_active: value.isActive === 'true', updated_at: new Date().toISOString() }).eq('id', value.planId),
    admin.from('plan_entitlements').update({ max_classes: value.maxClasses, max_students_per_class: value.maxStudentsPerClass, max_active_conversations: value.maxActiveConversations, max_storage_gb: value.maxStorageGb, updated_at: new Date().toISOString() }).eq('plan_id', value.planId),
  ]);
  if (planError || entitlementError) throw new Error(planError?.message || entitlementError?.message || 'Không thể cập nhật gói.');
  for (const [interval, amount] of [['monthly', value.monthlyPrice], ['yearly', value.yearlyPrice]] as const) {
    const { data: current, error: priceError } = await admin.from('plan_price_versions').select('id, amount').eq('plan_id', value.planId).eq('interval', interval).is('effective_until', null).maybeSingle();
    if (priceError) throw new Error(priceError.message);
    if (current && Number(current.amount) === amount) continue;
    if (current) {
      const { error } = await admin.from('plan_price_versions').update({ effective_until: new Date().toISOString() }).eq('id', current.id);
      if (error) throw new Error(error.message);
    }
    const { error } = await admin.from('plan_price_versions').insert({ plan_id: value.planId, interval, amount, created_by: user.id });
    if (error) throw new Error(error.message);
  }
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'plans.update', resourceType: 'plan', resourceId: value.planId, afterState: value });
  revalidatePath('/admin/plans'); revalidatePath('/pricing');
}
