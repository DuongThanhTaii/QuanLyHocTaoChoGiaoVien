import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReactNode } from 'react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile to check onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, full_name')
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
  const userName = profile?.full_name || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';

  return <DashboardLayout userRole={role} userName={userName} userEmail={userEmail}>{children}</DashboardLayout>;
}
