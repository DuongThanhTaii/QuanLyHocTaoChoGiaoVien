import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

const labels: Record<string, string> = { PRESENT: 'Có mặt', LATE: 'Đi trễ', ABSENT: 'Vắng', EXCUSED: 'Có phép', present: 'Có mặt', late: 'Đi trễ', absent: 'Vắng', excused: 'Có phép' };

export default async function StudentAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: currentStudent } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: records } = await admin.from('attendance_records').select('id, student_id, status, note, marked_at, students(full_name), class_sessions(session_date, start_time, end_time)').eq('class_id', id).order('marked_at', { ascending: false });
  return <div className="space-y-6"><div><h2 className="text-2xl font-bold tracking-tight text-zinc-900">Điểm danh</h2><p className="text-zinc-500">Theo dõi tình trạng điểm danh của lớp.</p></div><Card><CardHeader><CardTitle>Lịch sử điểm danh</CardTitle></CardHeader><CardContent>{!records?.length ? <p className="text-zinc-500">Chưa có dữ liệu điểm danh.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-zinc-500"><tr><th className="pb-3 font-medium">Học sinh</th><th className="pb-3 font-medium">Buổi học</th><th className="pb-3 font-medium">Trạng thái</th><th className="pb-3 font-medium">Ghi chú</th></tr></thead><tbody>{records.map((record: any) => { const student = Array.isArray(record.students) ? record.students[0] : record.students; const session = Array.isArray(record.class_sessions) ? record.class_sessions[0] : record.class_sessions; const ownRecord = record.student_id === currentStudent?.id; return <tr key={record.id} className="border-b border-zinc-100"><td className="py-4 font-medium text-zinc-800">{student?.full_name || 'Học sinh'}</td><td className="py-4 text-zinc-600">{session?.session_date ? new Date(session.session_date).toLocaleDateString('vi-VN') : '—'}</td><td className="py-4"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium">{labels[record.status] || record.status}</span></td><td className="py-4 text-zinc-600">{ownRecord ? (record.note || '—') : 'Riêng tư'}</td></tr>; })}</tbody></table></div>}</CardContent></Card></div>;
}
