import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { getBillingPlans, getUserBillingContext, getUserQuotaSnapshot } from '@/lib/billing/server';
import { PricingClient } from './pricing-client';
import { SubscriptionQuotaCard } from '../profile/SubscriptionQuotaCard';

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: primaryRole }, { data: profile }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('is_primary', true).maybeSingle(),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ]);
  const isTeacher = (primaryRole?.role || profile?.role) === 'teacher';
  const [context, plans, quota, params] = await Promise.all([getUserBillingContext(user.id), getBillingPlans(), isTeacher ? getUserQuotaSnapshot(user.id) : null, searchParams]);
  return <div className="space-y-6">{params.upgraded === '1' && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Nâng cấp gói thành công. Hạn mức sử dụng của bạn đã được cập nhật.</div>}{isTeacher && quota && <SubscriptionQuotaCard context={context} quota={quota} />}<PricingClient context={context} plans={plans.filter((plan) => plan.code !== 'enterprise')} /></div>;
}
