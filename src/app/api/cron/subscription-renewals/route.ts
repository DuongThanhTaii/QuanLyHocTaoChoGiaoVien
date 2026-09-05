import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/server';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getServiceClient();
  const now = new Date().toISOString();
  const { data: subscriptions, error } = await admin.from('subscriptions').select('id, teacher_id, current_period_end, renewal_attempt_count').eq('status', 'active').eq('auto_renew', true).lte('next_renewal_at', now);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let queued = 0;
  for (const subscription of subscriptions ?? []) {
    const attempt = Number(subscription.renewal_attempt_count ?? 0) + 1;
    if (attempt > 3) {
      await admin.from('subscriptions').update({ status: 'expired', auto_renew: false, renewal_status: 'failed', updated_at: now }).eq('id', subscription.id);
      continue;
    }
    const status = process.env.PAYOS_RECURRING_ENABLED === 'true' ? 'requires_action' : 'skipped';
    await admin.from('subscription_renewal_attempts').upsert({ subscription_id: subscription.id, attempt_number: attempt, status, scheduled_for: now, error_message: status === 'skipped' ? 'PayOS recurring/tokenization chưa được cấu hình production.' : null }, { onConflict: 'subscription_id,attempt_number' });
    await admin.from('subscriptions').update({ renewal_attempt_count: attempt, last_renewal_attempt_at: now, renewal_status: status === 'skipped' ? 'not_configured' : 'processing', next_renewal_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), updated_at: now }).eq('id', subscription.id);
    queued += 1;
  }
  return NextResponse.json({ processed: queued, recurringEnabled: process.env.PAYOS_RECURRING_ENABLED === 'true' });
}
