import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { enrollStudent, linkParent } from './actions';
import Link from 'next/link';

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
        <Card>
          <CardHeader>
            <CardTitle>Thêm học sinh</CardTitle>
            <CardDescription>Thêm học sinh vào lớp bằng email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={enrollStudent as any} className="flex flex-col gap-4">
              <input type="hidden" name="classId" value={classId} />
              <div className="space-y-2">
                <Label htmlFor="email">Email học sinh</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customFee">Học phí tùy chỉnh (Tùy chọn)</Label>
                <Input
                  id="customFee"
                  name="customFee"
                  type="number"
                  placeholder="Ví dụ: 100000"
                />
              </div>
              <Button type="submit" className="w-full">Thêm vào lớp</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liên kết Phụ huynh</CardTitle>
            <CardDescription>Cấp quyền cho phụ huynh theo dõi tiến độ học tập.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={linkParent as any} className="flex flex-col gap-4">
              <input type="hidden" name="classId" value={classId} />
              <div className="space-y-2">
                <Label htmlFor="studentId">Học sinh</Label>
                <select 
                  id="studentId" 
                  name="studentId" 
                  required
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {studentsWithProfiles.map(({ user }) => (
                    <option key={user?.id} value={user?.id}>
                      {user?.fullName || user?.email.value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email phụ huynh</Label>
                <Input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  placeholder="parent@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full">Liên kết</Button>
            </form>
          </CardContent>
        </Card>
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
