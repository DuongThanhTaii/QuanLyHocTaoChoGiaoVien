import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const attendanceBadgeMap: Record<string, { label: string; className: string }> = {
  PRESENT: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  present: { label: 'Có mặt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  LATE: { label: 'Đi trễ', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  late: { label: 'Đi trễ', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  ABSENT: { label: 'Vắng', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  absent: { label: 'Vắng', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  EXCUSED: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  excused: { label: 'Có phép', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' }
};

export default async function StudentClassSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Lấy thông tin học sinh
  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  // 1. Lấy lịch học định kỳ trong tuần (schedule_slots)
  const { data: slots } = await admin
    .from('schedule_slots')
    .select('id, day_of_week, start_time, end_time, room')
    .eq('class_id', id)
    .order('day_of_week', { ascending: true });

  // 2. Lấy danh sách các buổi học cụ thể (class_sessions)
  const { data: sessions } = await admin
    .from('class_sessions')
    .select('id, session_date, start_time, end_time, title, room, status')
    .eq('class_id', id)
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false });

  // 3. Lấy dữ liệu điểm danh của học sinh trong lớp này
  let attendanceMap = new Map<string, any>();
  if (student) {
    const { data: records } = await admin
      .from('attendance_records')
      .select('session_id, status, note, marked_at')
      .eq('class_id', id)
      .eq('student_id', student.id);

    if (records) {
      records.forEach((r: any) => {
        if (r.session_id) {
          attendanceMap.set(r.session_id, r);
        }
      });
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const sessionList = sessions || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Thời khóa biểu
        </h2>
      </div>

      {/* Phần 1: Lịch học định kỳ hàng tuần */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Lịch học định kỳ hàng tuần
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-0.5">
            Các khung giờ học cố định của lớp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!slots || slots.length === 0 ? (
            <div className="text-center py-6 text-zinc-400 text-xs">
              Giáo viên chưa thiết lập lịch học định kỳ trong tuần cho lớp này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {slots.map((slot: any) => {
                const dayLabel = dayNames[slot.day_of_week] || `Thứ ${slot.day_of_week}`;
                const startTime = slot.start_time?.substring(0, 5) || '';
                const endTime = slot.end_time?.substring(0, 5) || '';

                return (
                  <div 
                    key={slot.id} 
                    className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {dayLabel}
                      </span>
                      {slot.room && (
                        <Badge variant="outline" className="text-[10px] font-medium bg-background">
                          <MapPin className="w-3 h-3 mr-1 text-zinc-400" />
                          Phòng {slot.room}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phần 2: Danh sách các buổi học chi tiết bằng Shadcn Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Danh sách các buổi học ({sessionList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionList.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Chưa có buổi học nào được ghi nhận.
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Ngày học</TableHead>
                    <TableHead className="text-xs font-semibold">Thời gian</TableHead>
                    <TableHead className="text-xs font-semibold">Buổi học</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Điểm danh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionList.map((s: any) => {
                    const sDate = new Date(s.session_date);
                    const dayLabel = dayNames[sDate.getDay()] || '';
                    const dateFormatted = sDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const startTime = s.start_time ? s.start_time.substring(0, 5) : '';
                    const endTime = s.end_time ? s.end_time.substring(0, 5) : '';
                    const isToday = s.session_date === todayStr;
                    const isFuture = s.session_date > todayStr;

                    // Kiểm tra điểm danh
                    const att = attendanceMap.get(s.id);
                    let attStatus = null;
                    if (att) {
                      attStatus = attendanceBadgeMap[att.status] || { label: att.status, className: 'bg-zinc-100 text-zinc-700' };
                    }

                    return (
                      <TableRow 
                        key={s.id}
                        className={`text-sm ${isToday ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                      >
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                {dayLabel}, {dateFormatted}
                              </span>
                              {isToday && (
                                <Badge className="text-[10px] h-4.5 px-1.5 font-bold bg-primary text-primary-foreground">
                                  Hôm nay
                                </Badge>
                              )}
                            </div>
                            {isFuture && (
                              <span className="text-[11px] text-blue-600 dark:text-blue-400">
                                Buổi học sắp tới
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {startTime} - {endTime}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {s.title || 'Buổi học'}
                            </span>
                            {s.room && (
                              <span className="text-[11px] text-zinc-400">
                                (P.{s.room})
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {attStatus ? (
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-semibold ${attStatus.className}`}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {attStatus.label}
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-xs font-normal text-zinc-400 border-dashed border-zinc-300 dark:border-zinc-700"
                            >
                              Chưa điểm danh
                            </Badge>
                          )}
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
