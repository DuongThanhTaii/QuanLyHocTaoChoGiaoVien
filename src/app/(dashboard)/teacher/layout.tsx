import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
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

  if (role !== 'teacher') {
    // Redirect to the correct dashboard based on role
    if (role === 'student') redirect('/student');
    if (role === 'parent') redirect('/parent');
    redirect('/onboarding');
  }

  return <>{children}</>;
}
