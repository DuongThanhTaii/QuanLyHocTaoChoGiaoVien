import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { CheckCircle2, Clock, XCircle, AlertCircle, CalendarCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

const statusConfig: Record<string, { label: string; className: string }> = {
  PRESENT: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  present: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  LATE: { label: 'Đi trễ', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  late: { label: 'Đi trễ', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  ABSENT: { label: 'Vắng', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  absent: { label: 'Vắng', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  EXCUSED: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  excused: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
};

export default async function StudentAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: currentStudent } = await admin
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: records } = await admin
    .from('attendance_records')
    .select(`
      id,
      student_id,
      status,
      note,
      marked_at,
      students (
        id,
        full_name,
        email
      ),
      class_sessions (
        session_date,
        start_time,
        end_time,
        title
      )
    `)
    .eq('class_id', id)
    .order('marked_at', { ascending: false });

  const attendanceRecords = records || [];

  // Lọc thống kê riêng của học sinh này
  const myRecords = attendanceRecords.filter((r: any) => r.student_id === currentStudent?.id);
  const myTotal = myRecords.length;
  const myPresent = myRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'present').length;
  const myLate = myRecords.filter((r: any) => r.status === 'LATE' || r.status === 'late').length;
  const myAbsent = myRecords.filter((r: any) => r.status === 'ABSENT' || r.status === 'absent').length;
  const myRate = myTotal > 0 ? Math.round((myPresent / myTotal) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Điểm danh
        </h2>
      </div>

      {/* Thẻ tóm tắt chuyên cần cá nhân */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Tổng buổi học
            </span>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {myTotal}
            </div>
            <p className="text-[11px] text-zinc-400">Đã điểm danh</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Có mặt
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {myPresent}
            </div>
            <p className="text-[11px] text-zinc-400">Tỷ lệ: {myRate}%</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đi trễ
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {myLate}
            </div>
            <p className="text-[11px] text-zinc-400">Buổi vào trễ</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Vắng
            </span>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {myAbsent}
            </div>
            <p className="text-[11px] text-zinc-400">Buổi nghỉ học</p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng Lịch sử điểm danh dạng Shadcn Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lịch sử điểm danh ({attendanceRecords.length})
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Chi tiết tình trạng tham gia từng buổi học
              </CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Chưa có dữ liệu điểm danh nào trong lớp học này.
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Buổi học</TableHead>
                    <TableHead className="text-xs font-semibold">Học sinh</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record: any) => {
                    const student = Array.isArray(record.students) ? record.students[0] : record.students;
                    const session = Array.isArray(record.class_sessions) ? record.class_sessions[0] : record.class_sessions;
                    const isMe = record.student_id === currentStudent?.id;
                    const statusInfo = statusConfig[record.status] || { label: record.status, className: 'bg-zinc-100 text-zinc-700' };

                    return (
                      <TableRow 
                        key={record.id}
                        className={`text-sm ${isMe ? 'bg-primary/5 hover:bg-primary/10 font-medium' : ''}`}
                      >
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">
                              {session?.session_date 
                                ? new Date(session.session_date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
                                : '—'}
                            </span>
                            {session?.start_time && session?.end_time && (
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar 
                              name={student?.full_name || 'Học sinh'} 
                              email={student?.email} 
                              size="sm" 
                              className="w-7 h-7 text-[11px] shrink-0" 
                            />
                            <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100">
                              {student?.full_name || 'Học sinh'}
                            </span>
                            {isMe && (
                              <Badge variant="outline" className="text-[9px] font-semibold bg-primary/10 text-primary border-primary/20">
                                Bạn
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                          {isMe ? (record.note || '—') : <span className="italic text-zinc-400">Riêng tư</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
