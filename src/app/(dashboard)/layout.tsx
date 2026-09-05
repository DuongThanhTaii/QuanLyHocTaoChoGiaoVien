import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReactNode } from 'react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { getUserBillingContext } from '@/lib/billing/server';
import { DashboardThemeProviders } from '@/components/providers/DashboardThemeProviders';

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!user.email_confirmed_at) {
    redirect(`/register/verify-email?email=${encodeURIComponent(user.email ?? '')}`);
  }

  // Fetch profile to check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, full_name, ui_settings')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'ONBOARDING') {
    redirect('/onboarding');
  }

  // Fetch primary role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  const role = roleData?.role || 'teacher'; // fallback
  const userName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';
  const billingContext = await getUserBillingContext(user.id).catch(() => null);

  return (
    <DashboardThemeProviders>
      <DashboardLayout
      userRole={role} 
      userName={userName} 
      userEmail={userEmail}
      subscriptionPlanName={billingContext?.plan.code !== 'free' ? billingContext?.plan.name : undefined}
      uiSettings={profile?.ui_settings}
      >
        {children}
      </DashboardLayout>
    </DashboardThemeProviders>
  );
}
