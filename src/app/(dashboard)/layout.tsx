import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReactNode } from 'react';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function Layout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'teacher';

  return <DashboardLayout userRole={role}>{children}</DashboardLayout>;
}
