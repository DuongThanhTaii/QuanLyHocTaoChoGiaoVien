import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect based on user metadata role
  const role = user.user_metadata?.role;
  
  switch(role) {
    case 'admin':
      redirect('/admin');
    case 'student':
      redirect('/student/classes');
    case 'parent':
      redirect('/parent/students');
    case 'teacher':
    default:
      redirect('/teacher/classes');
  }
}
