'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminPermission, writeAdminAuditLog } from '@/lib/admin/server';

export type AdminPlanActionState = { error?: string; success?: string };

const PlanSchema = z.object({
  planId: z.string().uuid(), name: z.string().trim().min(2).max(80), description: z.string().trim().max(300),
  monthlyPrice: z.coerce.number().int().min(0), yearlyPrice: z.coerce.number().int().min(0),
  maxClasses: z.coerce.number().int().min(0).max(10000), maxStudentsPerClass: z.coerce.number().int().min(0).max(100000),
  maxActiveConversations: z.coerce.number().int().min(0).max(100000), maxStorageGb: z.coerce.number().int().min(0).max(100000),
  isActive: z.enum(['true', 'false']),
});

export async function updateBillingMode(_previousState: AdminPlanActionState, formData: FormData): Promise<AdminPlanActionState> {
  const mode = z.enum(['paid', 'free_access']).safeParse(formData.get('mode'));
  if (!mode.success) return { error: 'Chế độ thanh toán không hợp lệ.' };
  try {
    const { user, admin } = await requireAdminPermission('billing.manage');
    const { error } = await admin.from('billing_settings').update({ mode: mode.data, updated_by: user.id, updated_at: new Date().toISOString() }).eq('singleton', true);
    if (error) throw new Error(error.message);
    await writeAdminAuditLog(admin, { actorId: user.id, action: 'billing.toggle', resourceType: 'billing_settings', afterState: { mode: mode.data } });
    revalidatePath('/admin'); revalidatePath('/admin/plans');
    return { success: 'Đã lưu chế độ thanh toán.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không thể lưu chế độ thanh toán.' };
  }
}

export async function updatePlan(_previousState: AdminPlanActionState, formData: FormData): Promise<AdminPlanActionState> {
  const input = PlanSchema.safeParse({
    planId: formData.get('planId'), name: formData.get('name'), description: formData.get('description') || '',
    monthlyPrice: formData.get('monthlyPrice'), yearlyPrice: formData.get('yearlyPrice'), maxClasses: formData.get('maxClasses'),
    maxStudentsPerClass: formData.get('maxStudentsPerClass'), maxActiveConversations: formData.get('maxActiveConversations'), maxStorageGb: formData.get('maxStorageGb'), isActive: formData.get('isActive') || 'false',
  });
  if (!input.success) return { error: 'Dữ liệu gói không hợp lệ. Vui lòng kiểm tra lại các trường.' };
  try {
    // Trang này yêu cầu billing.manage, vì vậy thao tác lưu dùng cùng quyền để tránh
    // trường hợp Admin xem được gói nhưng không thể lưu do thiếu plans.manage.
    const { user, admin } = await requireAdminPermission('billing.manage');
    const value = input.data;
    const { error: planError } = await admin.from('plans').update({ name: value.name, description: value.description || null, price_monthly: value.monthlyPrice, price_yearly: value.yearlyPrice, is_active: value.isActive === 'true', updated_at: new Date().toISOString() }).eq('id', value.planId);
    if (planError) throw new Error(planError.message);
    const { error: entitlementError } = await admin.from('plan_entitlements').upsert({ plan_id: value.planId, max_classes: value.maxClasses, max_students_per_class: value.maxStudentsPerClass, max_active_conversations: value.maxActiveConversations, max_storage_gb: value.maxStorageGb, updated_at: new Date().toISOString() });
    if (entitlementError) throw new Error(entitlementError.message);
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
    revalidatePath('/'); revalidatePath('/admin/plans'); revalidatePath('/pricing');
    return { success: 'Đã lưu gói và cập nhật bảng giá trên landing page.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không thể cập nhật gói.' };
  }
}
