import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import Link from 'next/link';
import { 
  Sparkles, 
  Smile, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  MessageSquareQuote, 
  CheckCircle2, 
  XCircle,
  ArrowLeft
} from 'lucide-react';

const ratingBadgeMap: Record<string, { label: string; className: string; icon: any }> = {
  EXCELLENT: { label: 'Xuất sắc', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Sparkles },
  GOOD: { label: 'Tốt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Smile },
  AVERAGE: { label: 'Cần cố gắng', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: AlertCircle },
  POOR: { label: 'Chưa tập trung', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: AlertTriangle }
};

const attendanceStatusMap: Record<string, { label: string; className: string }> = {
  present: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  PRESENT: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  late: { label: 'Đi muộn', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  LATE: { label: 'Đi muộn', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  absent: { label: 'Vắng mặt', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  ABSENT: { label: 'Vắng mặt', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  excused: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  EXCUSED: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
};

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
    .maybeSingle();

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

  // Fetch evaluations
  const { data: evaluationsData } = await admin
    .from('session_evaluations')
    .select('*, class_sessions(*, classes(name)), profiles:marked_by(full_name, email)')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  const evaluations = evaluationsData || [];

  // Fetch attendance
  const { data: attendanceData } = await admin
    .from('attendance_records')
    .select('*, class_sessions(*, classes(name))')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  const attendance = attendanceData || [];

  // Thống kê chuyên cần
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((r: any) => r.status === 'present' || r.status === 'PRESENT').length;
  const lateCount = attendance.filter((r: any) => r.status === 'late' || r.status === 'LATE').length;
  const absentCount = attendance.filter((r: any) => r.status === 'absent' || r.status === 'ABSENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Tiến độ học tập: {profile?.full_name || 'Học sinh'}
          </h1>
          <p className="text-zinc-500 text-sm">Chi tiết nhận xét của giáo viên và lịch sử điểm danh.</p>
        </div>
        <Link href="/parent/students">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </Link>
      </div>

      {/* Menu con Tabs: Đánh giá & Điểm danh */}
      <Tabs defaultValue="evaluations" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 inline-flex">
          <TabsTrigger 
            value="evaluations" 
            className="px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs transition-all"
          >
            Đánh giá ({evaluations.length})
          </TabsTrigger>
          <TabsTrigger 
            value="attendance" 
            className="px-5 py-2 text-sm font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs transition-all"
          >
            Điểm danh ({attendance.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Đánh giá & Nhận xét sau buổi học */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Đánh giá & Nhận xét sau buổi học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Chưa có nhận xét hoặc đánh giá nào từ giáo viên.
                </div>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Buổi học</TableHead>
                        <TableHead className="text-xs font-semibold">Lớp học</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Đánh giá</TableHead>
                        <TableHead className="text-xs font-semibold">Lời dặn của giáo viên</TableHead>
                        <TableHead className="text-xs font-semibold">Giáo viên</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluations.map((item: any) => {
                        const session = Array.isArray(item.class_sessions) ? item.class_sessions[0] : item.class_sessions;
                        const classes = Array.isArray(session?.classes) ? session?.classes[0] : session?.classes;
                        const teacherProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                        const ratingInfo = ratingBadgeMap[item.rating] || { 
                          label: item.rating || 'Đánh giá', 
                          className: 'bg-zinc-100 text-zinc-700 border-zinc-200', 
                          icon: Smile 
                        };
                        const RatingIcon = ratingInfo.icon;
                        const noteText = item.comment || item.feedback;

                        const sDate = session?.session_date ? new Date(session.session_date) : new Date(item.marked_at);
                        const formattedDate = sDate.toLocaleDateString('vi-VN', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        });

                        const startTime = session?.start_time ? session.start_time.substring(0, 5) : '';
                        const endTime = session?.end_time ? session.end_time.substring(0, 5) : '';

                        return (
                          <TableRow key={item.id} className="text-sm">
                            <TableCell>
                              <div className="space-y-0.5">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block">
                                  {formattedDate}
                                </span>
                                {startTime && endTime && (
                                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                    {startTime} - {endTime}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                {classes?.name || 'Lớp học'}
                              </span>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-semibold gap-1.5 py-1 px-2.5 ${ratingInfo.className}`}
                              >
                                <RatingIcon className="w-3.5 h-3.5" />
                                {ratingInfo.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="max-w-md">
                              {noteText ? (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                  <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                  <span className="whitespace-pre-wrap">{noteText}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400 italic">Không có ghi chú thêm</span>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <UserAvatar 
                                  name={teacherProfile?.full_name || 'Giáo viên'} 
                                  email={teacherProfile?.email} 
                                  size="sm" 
                                  className="w-7 h-7 text-[11px] shrink-0" 
                                />
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                  {teacherProfile?.full_name || 'Giáo viên'}
                                </span>
                              </div>
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
        </TabsContent>

        {/* Tab 2: Lịch sử điểm danh */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Thẻ tóm tắt chuyên cần */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Tổng buổi học
                </span>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalAttendance}
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
                  {presentCount}
                </div>
                <p className="text-[11px] text-zinc-400">Tỷ lệ: {attendanceRate}%</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Đi muộn
                </span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {lateCount}
                </div>
                <p className="text-[11px] text-zinc-400">Buổi vào trễ</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Vắng mặt
                </span>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {absentCount}
                </div>
                <p className="text-[11px] text-zinc-400">Buổi nghỉ học</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lịch sử điểm danh
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Chưa có dữ liệu điểm danh nào được ghi nhận.
                </div>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Buổi học</TableHead>
                        <TableHead className="text-xs font-semibold">Lớp học</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                        <TableHead className="text-xs font-semibold">Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record: any) => {
                        const session = Array.isArray(record.class_sessions) ? record.class_sessions[0] : record.class_sessions;
                        const classes = Array.isArray(session?.classes) ? session?.classes[0] : session?.classes;
                        
                        const statusInfo = attendanceStatusMap[record.status] || { 
                          label: record.status, 
                          className: 'bg-zinc-100 text-zinc-700 border-zinc-200' 
                        };

                        const sDate = session?.session_date ? new Date(session.session_date) : new Date(record.marked_at);
                        const formattedDate = sDate.toLocaleDateString('vi-VN', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        });

                        const startTime = session?.start_time ? session.start_time.substring(0, 5) : '';
                        const endTime = session?.end_time ? session.end_time.substring(0, 5) : '';

                        return (
                          <TableRow key={record.id} className="text-sm">
                            <TableCell>
                              <div className="space-y-0.5">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block">
                                  {formattedDate}
                                </span>
                                {startTime && endTime && (
                                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                    {startTime} - {endTime}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                {classes?.name || 'Lớp học'}
                              </span>
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
                              {record.note || '—'}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
