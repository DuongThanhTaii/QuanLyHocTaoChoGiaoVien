import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { RoleSelectionForm } from './RoleSelectionForm';

export default async function OnboardingRoleSelectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <RoleSelectionForm />
  );
}
