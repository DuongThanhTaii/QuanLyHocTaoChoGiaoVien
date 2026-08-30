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
  const { data: classroom } = await admin.from('classes').select('name, subject, fee_per_session').eq('id', id).maybeSingle();
  const fee = classroom?.fee_per_session ? `${Number(classroom.fee_per_session).toLocaleString('vi-VN')} đ/buổi` : null;
  return <div className="space-y-6"><section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"><h1 className="text-3xl font-bold tracking-tight text-zinc-900">{classroom?.name || 'Lớp học'}</h1><p className="mt-2 text-lg text-zinc-500">{[classroom?.subject, fee].filter(Boolean).join(' · ') || 'Thông tin lớp học'}</p></section><StudentClassTabs classId={id} /><div className="pt-2">{children}</div></div>;
}
