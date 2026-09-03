import { createClient } from '@/infrastructure/auth/supabase/server';
import { getBillingPlans, getUserBillingContext } from '@/lib/billing/server';
import { PricingClient } from './pricing-client';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [context, plans] = await Promise.all([getUserBillingContext(user.id), getBillingPlans()]);
  return <PricingClient context={context} plans={plans.filter((plan) => plan.code !== 'enterprise')} />;
}
