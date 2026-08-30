import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { JoinClassCard } from './JoinClassCard';
import { JoinPendingNotice } from './JoinPendingNotice';

export default async function StudentClassesPage({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  const { join } = await searchParams;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: enrollments } = student ? await admin.from('enrollments').select('class_id, status, classes(id, name, subject, description, color)').eq('student_id', student.id).eq('status', 'ACTIVE') : { data: [] };
  const classes = (enrollments || []).map((item: any) => Array.isArray(item.classes) ? item.classes[0] : item.classes).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Lớp học của tôi</h1>
          <p className="text-zinc-500">Danh sách các lớp học bạn đang tham gia.</p>
        </div>
        <JoinClassCard />
      </div>
      {join === 'pending' && <JoinPendingNotice />}
      <Card>
        <CardHeader>
          <CardTitle>Các lớp học</CardTitle>
          <CardDescription>Cập nhật thông tin và bài tập từ giáo viên.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-zinc-300" />
              <h3 className="mt-4 text-lg font-medium text-zinc-900">Chưa có lớp học nào</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Bạn chưa được thêm vào lớp học nào. Vui lòng liên hệ giáo viên để được tham gia.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((classroom: any) => <Link key={classroom.id} href={`/student/classes/${classroom.id}`}><Card className="border-zinc-200 transition-shadow hover:shadow-md"><CardHeader><div className="h-1 w-12 rounded" style={{ backgroundColor: classroom.color || '#18181b' }} /><CardTitle className="mt-3">{classroom.name}</CardTitle><CardDescription>{classroom.subject || 'Chưa cập nhật môn học'}</CardDescription></CardHeader><CardContent><p className="line-clamp-2 text-sm text-zinc-500">{classroom.description || 'Xem tài liệu và lịch học của lớp.'}</p></CardContent></Card></Link>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
