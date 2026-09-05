import { createClient } from '@/infrastructure/auth/supabase/server';
import { getUserBillingContext } from '@/lib/billing/server';
import { BillingManagementClient } from './BillingManagementClient';

export default async function BillingManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const context = await getUserBillingContext(user.id);
  return <BillingManagementClient planName={context.plan.name} recurringReady={process.env.PAYOS_RECURRING_ENABLED === 'true'} subscription={context.subscription ? { autoRenew: context.subscription.autoRenew !== false, periodEnd: context.subscription.currentPeriodEnd, renewalStatus: context.subscription.renewalStatus ?? 'not_configured' } : null} />;
}
