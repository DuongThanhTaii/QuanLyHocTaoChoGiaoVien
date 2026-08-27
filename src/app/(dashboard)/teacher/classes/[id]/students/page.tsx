import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddStudentTabs } from './AddStudentTabs';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function ClassStudentsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const classId = params.id;
  const repos = await getRepositories();
  const supabase = await createClient();

  const enrollments = await repos.enrollments.findActiveByClass(classId);

  const students = await Promise.all(
    enrollments.map(async (enrollment) => {
      const studentProfile = await repos.students.findById(enrollment.studentId);
      return {
        enrollment,
        studentProfile
      };
    })
  );

  const { data: invitations } = await supabase
    .from('class_invitations')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const activeInvitation = invitations?.[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Student List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Học sinh trong lớp</CardTitle>
                <CardDescription>Danh sách {students.length} học sinh đang học</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Chưa có học sinh nào trong lớp.
                      </TableCell>
                    </TableRow>
                  )}
                  {students.map(({ enrollment, studentProfile }) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{studentProfile?.full_name || 'Không rõ'}</TableCell>
                      <TableCell>{studentProfile?.email || '--'}</TableCell>
                      <TableCell>{studentProfile?.phone || '--'}</TableCell>
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

        {/* Right Column: Add Student Widget */}
        <div className="space-y-6">
           <AddStudentTabs classId={classId} invitationCode={activeInvitation?.join_code} />
        </div>

      </div>
    </div>
  );
}
