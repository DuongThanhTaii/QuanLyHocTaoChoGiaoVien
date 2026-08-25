import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { EnrollStudentForm, LinkParentForm } from './StudentForms';

export default async function ClassStudentsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const classId = params.id;
  const repos = await getRepositories();

  const enrollments = await repos.enrollments.findActiveByClass(classId);

  const studentsWithProfiles = await Promise.all(
    enrollments.map(async (enrollment) => {
      const user = await repos.users.findById(enrollment.studentId);
      return {
        enrollment,
        user
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Danh sách học sinh</h1>
        <div className="flex gap-2">
          <Link href={`/teacher/classes/${classId}`}>
            <Button variant="outline">Trở về lớp học</Button>
          </Link>
          <Link href={`/teacher/classes/${classId}/attendance`}>
            <Button variant="outline">Điểm danh</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EnrollStudentForm classId={classId} />
        <LinkParentForm classId={classId} students={studentsWithProfiles} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Học sinh trong lớp ({studentsWithProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Học phí riêng</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsWithProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chưa có học sinh nào trong lớp.
                  </TableCell>
                </TableRow>
              )}
              {studentsWithProfiles.map(({ enrollment, user }) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{user?.fullName || 'Không rõ'}</TableCell>
                  <TableCell>{user?.email.value || 'Không rõ'}</TableCell>
                  <TableCell>
                    {enrollment.customFee ? `${enrollment.customFee.amount.toLocaleString()} ${enrollment.customFee.currency}` : 'Mặc định'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                      Đang học
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
