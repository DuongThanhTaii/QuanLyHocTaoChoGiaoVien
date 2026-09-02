import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!role) redirect('/dashboard');

  return children;
}
