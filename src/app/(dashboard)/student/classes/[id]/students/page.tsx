import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';

export default async function StudentClassmatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Lấy thông tin học sinh hiện tại
  const { data: currentStudent } = user ? await admin
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle() : { data: null };

  // Lấy danh sách học sinh đang học
  const { data: enrollments } = await admin
    .from('enrollments')
    .select(`
      id,
      student_id,
      status,
      joined_at,
      students (
        id,
        full_name,
        email
      )
    `)
    .eq('class_id', id)
    .eq('status', 'ACTIVE')
    .order('joined_at', { ascending: true });

  const studentList = (enrollments || []).map((row: any) => {
    const s = Array.isArray(row.students) ? row.students[0] : row.students;
    return {
      enrollmentId: row.id,
      studentId: row.student_id,
      fullName: s?.full_name || 'Học sinh',
      email: s?.email || '',
      joinedAt: row.joined_at,
      isMe: s?.id === currentStudent?.id
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Học sinh trong lớp
        </h2>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Danh sách học sinh ({studentList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentList.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Chưa có học sinh nào trong lớp học này.
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-semibold">#</TableHead>
                    <TableHead className="text-xs font-semibold">Học sinh</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Ngày vào lớp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((st: any, index: number) => (
                    <TableRow 
                      key={st.enrollmentId || st.studentId}
                      className={`text-sm ${st.isMe ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                    >
                      <TableCell className="text-center font-medium text-xs text-zinc-400">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            name={st.fullName} 
                            email={st.email} 
                            size="sm" 
                            className="w-8 h-8 text-xs shrink-0" 
                          />
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {st.fullName}
                            </span>
                            {st.isMe && (
                              <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                                Bạn
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium"
                        >
                          Đang học
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-zinc-500">
                        {st.joinedAt ? new Date(st.joinedAt).toLocaleDateString('vi-VN') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
