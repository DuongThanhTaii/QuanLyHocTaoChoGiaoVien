import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .maybeSingle();

  // A new account has a session before it has a role. Resolve onboarding first,
  // before choosing a dashboard target, so no Teacher dashboard is painted briefly.
  if (profile?.status !== 'ACTIVE') {
    redirect('/onboarding');
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle();
  const role = roleData?.role || user.user_metadata?.role;
  
  switch(role) {
    case 'admin':
      redirect('/admin');
    case 'student':
      redirect('/student/classes');
    case 'parent':
      redirect('/parent/students');
    case 'teacher':
    default:
      redirect('/teacher');
  }
}
