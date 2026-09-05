'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';

export async function setSubscriptionAutoRenew(enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Vui lòng đăng nhập lại.');
  const admin = getServiceClient();
  const { data: subscription, error: lookupError } = await admin.from('subscriptions').select('id').eq('teacher_id', user.id).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (lookupError || !subscription) throw new Error('Không tìm thấy gói đăng ký đang hoạt động.');
  const { error } = await admin.from('subscriptions').update({
    auto_renew: enabled,
    cancel_at_period_end: !enabled,
    renewal_status: enabled ? 'not_configured' : 'cancelled',
    updated_at: new Date().toISOString(),
  }).eq('id', subscription.id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings/billing');
  revalidatePath('/pricing');
  return { success: true };
}
