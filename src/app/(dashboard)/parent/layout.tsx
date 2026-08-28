import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch primary role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  const role = roleData?.role;

  if (role !== 'parent') {
    // Redirect to the correct dashboard based on role
    if (role === 'teacher') redirect('/teacher');
    if (role === 'student') redirect('/student');
    redirect('/onboarding');
  }

  return <>{children}</>;
}
