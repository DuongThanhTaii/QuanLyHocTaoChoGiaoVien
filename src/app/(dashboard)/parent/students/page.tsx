import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LinkStudentModal } from './components/LinkStudentModal';
import { Clock } from 'lucide-react';

export default async function ParentStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: guardianData } = await admin
    .from('guardians')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let students: any[] = [];

  if (guardianData) {
    const { data: studentGuardians } = await admin
      .from('student_guardians')
      .select(`
        student_id,
        students:student_id (
          id,
          full_name,
          email,
          user_id
        )
      `)
      .eq('guardian_id', guardianData.id);

    if (studentGuardians) {
      students = studentGuardians;
    }
  }

  const { data: pendingRequests } = await admin
    .from('guardian_student_requests')
    .select('*')
    .eq('parent_id', user.id)
    .eq('status', 'PENDING');

  const requests = pendingRequests || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Con của tôi</h1>
          <p className="text-zinc-500">Quản lý và theo dõi tiến độ học tập của các con.</p>
        </div>
        <LinkStudentModal />
      </div>

      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-500" /> Yêu cầu đang chờ xác nhận</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map(req => (
              <Card key={req.id} className="border-amber-200 bg-amber-50">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium">Đang chờ xác nhận</CardTitle>
                  <CardDescription>Email: {req.student_email}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.length === 0 ? (
          <Card className="col-span-full border-dashed bg-zinc-50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <p>Chưa có học sinh nào được liên kết với tài khoản của bạn.</p>
              <p className="text-sm mt-1">Vui lòng chọn 'Liên kết học sinh' để gửi yêu cầu đến email của học sinh.</p>
            </CardContent>
          </Card>
        ) : (
          students.map((item: any) => {
            const profile = Array.isArray(item.students) ? item.students[0] : item.students;
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
