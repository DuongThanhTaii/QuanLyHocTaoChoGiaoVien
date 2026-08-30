import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ParentStudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Find guardian id first
  const { data: guardianData } = await admin
    .from('guardians')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!guardianData) return <div className="p-12 text-center text-zinc-500">Bạn chưa có hồ sơ phụ huynh.</div>;

  // Verify parent has access to this student
  const { data: link } = await admin
    .from('student_guardians')
    .select('student_id')
    .eq('guardian_id', guardianData.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (!link) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Bạn không có quyền xem thông tin của học sinh này.
      </div>
    );
  }

  const { data: profile } = await admin
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single();

  // Fetch attendance
  const { data: attendanceData } = await admin
    .from('attendance_records')
    .select('*, schedule_slots(*, classes(name))')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  const attendance = attendanceData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Tiến độ học tập: {profile?.full_name || 'Học sinh'}
          </h1>
          <p className="text-zinc-500">Chi tiết điểm danh và lịch sử học.</p>
        </div>
        <Link href="/parent/students">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử điểm danh</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Lớp / Ca học</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-zinc-500">
                    Chưa có dữ liệu điểm danh.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => {
                  const slot = Array.isArray(record.schedule_slots) ? record.schedule_slots[0] : record.schedule_slots;
                  const classes = Array.isArray(slot?.classes) ? slot?.classes[0] : slot?.classes;
                  
                  let statusBadge = '';
                  let statusText = '';
                  switch (record.status) {
                    case 'present':
                      statusBadge = 'bg-green-50 text-green-700 ring-green-600/20';
                      statusText = 'Có mặt';
                      break;
                    case 'absent':
                      statusBadge = 'bg-red-50 text-red-700 ring-red-600/20';
                      statusText = 'Vắng mặt';
                      break;
                    case 'late':
                      statusBadge = 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
                      statusText = 'Đi muộn';
                      break;
                    case 'excused':
                      statusBadge = 'bg-blue-50 text-blue-700 ring-blue-600/20';
                      statusText = 'Có phép';
                      break;
                  }

                  return (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.created_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <div className="font-medium">{classes?.name}</div>
                        <div className="text-xs text-zinc-500">{slot?.start_time} - {slot?.end_time}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge}`}>
                          {statusText}
                        </span>
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
