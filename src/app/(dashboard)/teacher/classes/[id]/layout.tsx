import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ClassTabs } from './ClassTabs';
import { ClassWorkspaceHeader } from './ClassWorkspaceHeader';

export default async function ClassWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: classroom } = await supabase
    .from('classes')
    .select('name, subject, fee_per_session, location, online_meeting_url')
    .eq('id', id)
    .single();

  if (!classroom) {
    return <div>Class not found</div>;
  }

  return (
    <div className="space-y-6">
      <ClassWorkspaceHeader classId={id} name={classroom.name} subject={classroom.subject} fee={classroom.fee_per_session} />

      <ClassTabs classId={id} />

      {/* Tab Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
