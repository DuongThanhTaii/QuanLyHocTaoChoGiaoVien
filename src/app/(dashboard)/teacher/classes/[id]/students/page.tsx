import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddStudentTabs } from './AddStudentTabs';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getAppUrl } from '@/lib/app-url';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, CheckCircle2, HelpCircle, Pencil } from 'lucide-react';
import { CopyPersonalLinkButton } from './CopyPersonalLinkButton';
import { EditStudentForm } from './StudentForms';

export default async function ClassStudentsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const classId = params.id;
  const repos = await getRepositories();
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Use Admin client to bypass RLS since the layout already verified teacher ownership
  const { data: enrollmentsData } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE');

  const students = await Promise.all(
    (enrollmentsData || []).map(async (enrollment: any) => {
      const { data: studentProfile } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', enrollment.student_id)
        .single();
        
      return {
        enrollment: {
          id: enrollment.id,
          studentId: enrollment.student_id,
          classId: enrollment.class_id,
          status: enrollment.status
        },
        studentProfile
      };
    })
  );

  const { data: invitations } = await supabaseAdmin
    .from('class_invitations')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const activeInvitation = invitations?.[0];

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Học sinh trong lớp</CardTitle>
            <CardDescription>Danh sách {students.length} học sinh đang học</CardDescription>
          </div>
          <Sheet>
            <SheetTrigger render={<Button size="sm" className="h-[41px] px-4" />}>
              <Plus className="h-4 w-4 mr-2" /> Thêm học sinh
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
              <div className="p-6 pt-12">
                <AddStudentTabs classId={classId} invitationCode={activeInvitation?.join_code} joinUrl={activeInvitation ? `${appUrl}/join/${activeInvitation.join_code}` : undefined} />
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-zinc-900">Họ tên</TableHead>
                    <TableHead className="font-semibold text-zinc-900">Email</TableHead>
                    <TableHead className="font-semibold text-zinc-900">SĐT</TableHead>
                    <TableHead className="font-semibold text-zinc-900">Trạng thái</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-900">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {studentProfile?.user_id ? (
                            <span title="Đã tham gia (Đã liên kết tài khoản)" className="inline-flex items-center justify-center text-green-600 bg-green-50 p-1.5 rounded-md border border-green-200">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span title="Chưa tham gia" className="inline-flex items-center justify-center text-zinc-400 bg-zinc-50 p-1.5 rounded-md border border-zinc-200">
                              <HelpCircle className="w-4 h-4" />
                            </span>
                          )}
                          
                          {studentProfile && !studentProfile.user_id && activeInvitation && (
                            <div title="Sao chép link tham gia">
                              <CopyPersonalLinkButton url={`${appUrl}/join/${activeInvitation.join_code}?claim=${studentProfile.id}`} />
                            </div>
                          )}
                          
                          {studentProfile && (
                            <Sheet>
                              <SheetTrigger render={<Button variant="outline" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900" title="Chỉnh sửa thông tin" />}>
                                <Pencil className="h-4 w-4" />
                              </SheetTrigger>
                              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                                <div className="p-6 pt-12">
                                  <h2 className="text-lg font-semibold mb-6">Chỉnh sửa thông tin học sinh</h2>
                                  <EditStudentForm classId={classId} student={studentProfile} />
                                </div>
                              </SheetContent>
                            </Sheet>
                          )}
                        </div>
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
