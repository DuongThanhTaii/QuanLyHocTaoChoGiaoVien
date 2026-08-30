import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function StudentClassmatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: students } = await admin.from('enrollments').select('student_id, students(full_name)').eq('class_id', id).eq('status', 'ACTIVE');
  return <div className="space-y-6"><div><h2 className="text-2xl font-bold tracking-tight text-zinc-900">Học sinh trong lớp</h2><p className="text-zinc-500">Danh sách học sinh đang học.</p></div><Card><CardHeader><CardTitle>Danh sách học sinh</CardTitle></CardHeader><CardContent>{students?.length ? <ul className="divide-y divide-zinc-100">{students.map((row: any) => { const student = Array.isArray(row.students) ? row.students[0] : row.students; return <li key={row.student_id} className="py-4 font-medium text-zinc-800">{student?.full_name || 'Học sinh'}</li>; })}</ul> : <p className="text-zinc-500">Chưa có học sinh đang học.</p>}</CardContent></Card></div>;
}
