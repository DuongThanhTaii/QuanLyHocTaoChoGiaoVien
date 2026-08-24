import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ParentStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: parentStudents } = await supabase
    .from('parent_students')
    .select(`
      student_id,
      profiles:student_id (id, full_name, email)
    `)
    .eq('parent_id', user.id);

  const students = parentStudents || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Con của tôi</h1>
        <p className="text-zinc-500">Quản lý và theo dõi tiến độ học tập của các con.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.length === 0 ? (
          <Card className="col-span-full border-dashed bg-zinc-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <p>Chưa có học sinh nào được liên kết với tài khoản của bạn.</p>
              <p className="text-sm mt-1">Vui lòng cung cấp email này cho Giáo viên để họ liên kết.</p>
            </CardContent>
          </Card>
        ) : (
          students.map((item: any) => {
            const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return (
              <Card key={item.student_id} className="border-zinc-200">
                <CardHeader>
                  <CardTitle>{profile?.full_name || 'Học sinh'}</CardTitle>
                  <CardDescription>{profile?.email || ''}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Link href={`/parent/students/${item.student_id}`}>
                    <Button>Xem tiến độ</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
