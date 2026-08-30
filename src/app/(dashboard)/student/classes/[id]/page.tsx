import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { createClient: createAdmin } = require('@supabase/supabase-js'); const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: enrollment } = student ? await admin.from('enrollments').select('id').eq('class_id', id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle() : { data: null };
  if (!enrollment) return <p>Bạn chưa được duyệt vào lớp này.</p>;
  const { data: classroom } = await admin.from('classes').select('name, subject, description').eq('id', id).single();
  const { data: sessions } = await admin.from('class_sessions').select('session_date, start_time, end_time, title').eq('class_id', id).gte('session_date', new Date().toISOString().slice(0, 10)).order('session_date').limit(5);
  return <div className="space-y-6"><Card><CardHeader><CardTitle>Thông tin lớp</CardTitle></CardHeader><CardContent>{classroom?.description || 'Giáo viên chưa thêm mô tả.'}</CardContent></Card><Card><CardHeader><CardTitle>Lịch học sắp tới</CardTitle></CardHeader><CardContent>{sessions?.length ? <ul className="space-y-2">{sessions.map((s: any) => <li key={`${s.session_date}-${s.start_time}`}>{new Date(s.session_date).toLocaleDateString('vi-VN')} · {s.start_time}–{s.end_time} · {s.title || 'Buổi học'}</li>)}</ul> : 'Chưa có lịch học sắp tới.'}</CardContent></Card><Card><CardHeader><CardTitle>Hoạt động gần đây</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-500">Các lần làm và nộp bài tập của bạn sẽ được ghi lại tại đây.</p></CardContent></Card></div>;
}
