import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Smile, 
  AlertCircle, 
  AlertTriangle,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';

const ratingBadgeMap: Record<string, { label: string; badge: string; icon: any }> = {
  EXCELLENT: { label: 'Xuất sắc', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Sparkles },
  GOOD: { label: 'Tốt', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Smile },
  AVERAGE: { label: 'Cần cố gắng', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertCircle },
  POOR: { label: 'Chưa tập trung', badge: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertTriangle }
};

export default async function StudentClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Kiểm tra học sinh và ghi danh
  const { data: student } = await admin
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: enrollment } = student
    ? await admin.from('enrollments').select('id').eq('class_id', id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle()
    : { data: null };

  if (!enrollment) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800 dark:text-amber-300">
        Bạn chưa được duyệt vào lớp học này hoặc lớp học đã tạm dừng.
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 2. Tải thông tin lớp học & Giáo viên phụ trách
  const { data: classroom } = await admin
    .from('classes')
    .select(`
      id,
      name,
      subject,
      description,
      fee_per_session,
      teacher_id,
      profiles:teacher_id (
        full_name,
        email,
        phone,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  const teacher = Array.isArray(classroom?.profiles) ? classroom.profiles[0] : classroom?.profiles;

  // 3. Đếm sĩ số lớp
  const { count: studentCount } = await admin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', id)
    .eq('status', 'ACTIVE');

  // 4. Lịch học sắp tới
  // Ưu tiên 1: Lấy từ class_sessions
  const { data: upcomingSessions } = await admin
    .from('class_sessions')
    .select('id, session_date, start_time, end_time, title, room')
    .eq('class_id', id)
    .gte('session_date', todayStr)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(2);

  let upcomingList: any[] = [];
  if (upcomingSessions && upcomingSessions.length > 0) {
    upcomingList = upcomingSessions.map((s: any) => {
      const sDate = new Date(s.session_date);
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayOfWeek = dayNames[sDate.getDay()];
      const isToday = s.session_date === todayStr;
      return {
        label: isToday ? 'Hôm nay' : `${dayOfWeek}, ${sDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`,
        time: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`,
        room: s.room || null,
        title: s.title || 'Buổi học'
      };
    });
  } else {
    // Ưu tiên 2: Tính toán từ thời khóa biểu định kỳ (schedule_slots)
    const { data: slots } = await admin
      .from('schedule_slots')
      .select('id, day_of_week, start_time, end_time, room')
      .eq('class_id', id);

    if (slots && slots.length > 0) {
      const currentDay = now.getDay();
      const sortedSlots = [...slots].sort((a: any, b: any) => {
        const diffA = (a.day_of_week - currentDay + 7) % 7;
        const diffB = (b.day_of_week - currentDay + 7) % 7;
        return diffA - diffB;
      });

      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      upcomingList = sortedSlots.slice(0, 2).map((slot: any) => {
        const daysUntil = (slot.day_of_week - currentDay + 7) % 7;
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil));
        return {
          label: daysUntil === 0 ? 'Hôm nay' : `${dayNames[slot.day_of_week]}, ${targetDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`,
          time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
          room: slot.room || null,
          title: 'Lịch học định kỳ'
        };
      });
    }
  }

  // 5. Thống kê chuyên cần của học sinh
  let attendanceTotal = 0;
  let attendancePresent = 0;
  if (student) {
    const { data: attRecords } = await admin
      .from('attendance_records')
      .select('status')
      .eq('class_id', id)
      .eq('student_id', student.id);

    if (attRecords) {
      attendanceTotal = attRecords.length;
      attendancePresent = attRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'present').length;
    }
  }
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 100;

  // 6. Đánh giá gần nhất từ giáo viên
  let latestEvaluation: any = null;
  if (student) {
    const { data: evals } = await admin
      .from('session_evaluations')
      .select('rating, comment, marked_at, class_sessions(session_date)')
      .eq('class_id', id)
      .eq('student_id', student.id)
      .order('marked_at', { ascending: false })
      .limit(1);

    if (evals && evals.length > 0) {
      latestEvaluation = evals[0];
    }
  }

  // 7. Bài giảng mới nhất
  const { data: latestLessons } = await admin
    .from('lessons')
    .select('id, title, content, created_at, materials(id, name)')
    .eq('class_id', id)
    .order('created_at', { ascending: false })
    .limit(2);

  return (
    <div className="space-y-6">
      {/* 3 Thẻ thống kê tổng quan nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sĩ số lớp */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Sĩ số lớp
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Users className="w-3 h-3" />
              <span>Thành viên</span>
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {studentCount || 0}
            </div>
            <p className="text-xs text-zinc-500">Học sinh đang theo học</p>
          </CardContent>
        </Card>

        {/* Chuyên cần */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Chuyên cần của bạn
            </span>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>{attendanceRate}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {attendanceRate}%
            </div>
            <p className="text-xs text-zinc-500">
              {attendanceTotal > 0 ? `Có mặt ${attendancePresent}/${attendanceTotal} buổi` : 'Chưa có buổi học ghi nhận'}
            </p>
          </CardContent>
        </Card>

        {/* Đánh giá gần nhất */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Đánh giá gần nhất
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Giáo viên</span>
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 truncate">
              {latestEvaluation ? (ratingBadgeMap[latestEvaluation.rating]?.label || 'Tốt') : '—'}
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {latestEvaluation?.comment ? `"${latestEvaluation.comment}"` : 'Chưa có nhận xét mới'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cột 2 phần: Thông tin lớp & Lịch học sắp tới */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Khối bên trái (2 cột): Thông tin lớp học & Giáo viên */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin lớp & Giáo viên */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Thông tin lớp học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Giáo viên phụ trách */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <UserAvatar 
                  name={teacher?.full_name || 'Giáo viên'} 
                  email={teacher?.email} 
                  size="lg" 
                  className="w-12 h-12 text-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {teacher?.full_name || 'Giáo viên'}
                    </h4>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                      Giáo viên phụ trách
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                    {teacher?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" /> {teacher.email}
                      </span>
                    )}
                    {teacher?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> {teacher.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mô tả lớp học */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Mô tả & Giới thiệu
                </span>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {classroom?.description || 'Giáo viên chưa cập nhật mô tả chi tiết cho lớp học này.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bài giảng mới nhất */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Bài giảng mới nhất
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Tài liệu học tập do giáo viên cung cấp
                </CardDescription>
              </div>
              <Link 
                href={`/student/classes/${id}/lessons`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Xem tất cả
              </Link>
            </CardHeader>
            <CardContent>
              {!latestLessons || latestLessons.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  Chưa có bài giảng nào được đăng trong lớp này.
                </div>
              ) : (
                <div className="space-y-3">
                  {latestLessons.map((lesson: any) => (
                    <div 
                      key={lesson.id} 
                      className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {lesson.title}
                        </h4>
                        <span className="text-[11px] text-zinc-400 shrink-0">
                          {new Date(lesson.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {lesson.content && (
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-2">
                          {lesson.content}
                        </p>
                      )}
                      {lesson.materials && lesson.materials.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{lesson.materials.length} tài liệu đính kèm</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Khối bên phải (1 cột): Lịch học sắp tới */}
        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Lịch học sắp tới
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Các buổi học gần nhất của bạn
                </CardDescription>
              </div>
              <Link 
                href={`/student/classes/${id}/schedule`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Thời khóa biểu
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingList.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                  Chưa có lịch học sắp tới.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingList.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {item.label}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-medium bg-background">
                          {item.title}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-primary">
                          <Clock className="w-3.5 h-3.5" /> {item.time}
                        </span>
                        {item.room && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Phòng {item.room}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
