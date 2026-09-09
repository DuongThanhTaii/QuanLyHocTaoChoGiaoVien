import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { StudentClassTabs } from './StudentClassTabs';

export default async function StudentClassLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: enrollment } = student ? await admin.from('enrollments').select('id').eq('class_id', id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle() : { data: null };
  if (!enrollment) return <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">Bạn chưa được duyệt vào lớp này.</p>;
  return <div className="space-y-3"><StudentClassTabs classId={id} /><div className="pt-3">{children}</div></div>;
}
