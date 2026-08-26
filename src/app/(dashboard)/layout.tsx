import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReactNode } from 'react';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'teacher';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';

  return <DashboardLayout userRole={role} userName={userName} userEmail={userEmail}>{children}</DashboardLayout>;
}
