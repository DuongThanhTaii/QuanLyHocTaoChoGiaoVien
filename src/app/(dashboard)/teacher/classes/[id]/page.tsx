import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Banknote, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ClassAnnouncementBox } from './components/ClassAnnouncementBox';
import { ClassFeedList, FeedItem } from './components/ClassFeedList';
import { StudentProgressLedger, StudentLedgerItem } from './components/StudentProgressLedger';

export default async function ClassOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 1. Thống kê học sinh Active
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, students(id, full_name, phone, email)')
    .eq('class_id', id)
    .eq('status', 'ACTIVE');

  const studentList = (enrollments || []).map((e: any) => e.students).filter(Boolean);
  const studentCount = studentList.length;

  // 2. Tìm buổi học tiếp theo (Buổi học tới)
  // Ưu tiên 1: Tìm trong class_sessions có ngày >= hôm nay
  const { data: nextSessions } = await supabaseAdmin
    .from('class_sessions')
    .select('id, title, session_date, start_time, end_time, room, status')
    .eq('class_id', id)
    .gte('session_date', todayStr)
    .neq('status', 'CANCELLED')
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1);

  let nextSessionText = 'Chưa có lịch';
  let nextSessionSubtext = 'Chưa có buổi học nào sắp tới';

  if (nextSessions && nextSessions.length > 0) {
    const s = nextSessions[0];
    const sDate = new Date(s.session_date);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[sDate.getDay()];
    const dateFormatted = sDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const isToday = s.session_date === todayStr;

    const timeRange = `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`;
    nextSessionText = isToday ? `Hôm nay (${timeRange})` : `${dayOfWeek}, ${dateFormatted}`;
    nextSessionSubtext = isToday ? 'Đang / Sắp diễn ra hôm nay' : `${timeRange}${s.room ? ` • Phòng ${s.room}` : ''}`;
  } else {
    // Ưu tiên 2: Tính toán từ lịch học định kỳ (schedule_slots)
    const { data: slots } = await supabaseAdmin
      .from('schedule_slots')
      .select('id, day_of_week, start_time, end_time, room')
      .eq('class_id', id);

    if (slots && slots.length > 0) {
      const currentDay = now.getDay();
      // Sắp xếp slot theo ngày gần nhất tiếp theo
      const sortedSlots = [...slots].sort((a, b) => {
        const diffA = (a.day_of_week - currentDay + 7) % 7;
        const diffB = (b.day_of_week - currentDay + 7) % 7;
        return diffA - diffB;
      });

      const nextSlot = sortedSlots[0];
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const daysUntil = (nextSlot.day_of_week - currentDay + 7) % 7;
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil));

      const timeRange = `${nextSlot.start_time.substring(0, 5)} - ${nextSlot.end_time.substring(0, 5)}`;
      nextSessionText = `${dayNames[nextSlot.day_of_week]}, ${targetDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
      nextSessionSubtext = `${timeRange}${nextSlot.room ? ` • Phòng ${nextSlot.room}` : ''}`;
    }
  }

  // 3. Tính toán Tỷ lệ đóng học phí & Công nợ của lớp
  const { data: classInvoices } = await supabaseAdmin
    .from('invoices')
    .select('id, student_id, total_amount, status, period_start, invoice_number, created_at')
    .eq('class_id', id);

  const totalInvoices = (classInvoices || []).length;
  const paidInvoices = (classInvoices || []).filter((i: any) => i.status === 'paid');
  const paidCount = paidInvoices.length;
  const paidAmount = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);
  const totalBilledAmount = (classInvoices || []).reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

  const tuitionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;
  const tuitionText = totalInvoices > 0 ? `${tuitionRate}%` : 'Chưa có HĐ';
  const tuitionSubtext = totalInvoices > 0 
    ? `Đã thu ${paidAmount.toLocaleString('vi-VN')} đ / ${totalBilledAmount.toLocaleString('vi-VN')} đ` 
    : 'Chưa phát hành hóa đơn cho lớp';

  // 4. Lấy Bài giảng & Thông báo cho Hoạt động gần đây
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title, content, created_at, materials(id, name, size_bytes)')
    .eq('class_id', id)
    .order('created_at', { ascending: false })
    .limit(6);

  const feedItems: FeedItem[] = (lessons || []).map((l: any) => ({
    id: l.id,
    type: l.title?.includes('[Thông báo]') ? 'announcement' : 'lesson',
    title: l.title,
    content: l.content,
    createdAt: l.created_at,
    materials: (l.materials || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      sizeBytes: m.size_bytes || 0
    }))
  }));

  // 5. Bảng Tổng Hợp Học Viên 360° (Student Progress Matrix)
  const studentIds = studentList.map((s: any) => s.id);

  // Lấy tổng số buổi đã điểm danh của lớp
  const { data: sessionsCount } = await supabaseAdmin
    .from('class_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', id);

  const totalClassSessions = sessionsCount || 0;

  // Lấy lịch sử điểm danh của học sinh
  const { data: attendanceRecords } = await supabaseAdmin
    .from('attendance_records')
    .select('student_id, status')
    .eq('class_id', id);

  // Lấy đánh giá học lực gần nhất của từng học sinh
  const { data: evaluations } = await supabaseAdmin
    .from('session_evaluations')
    .select('student_id, rating, feedback, marked_at')
    .eq('class_id', id)
    .order('marked_at', { ascending: false });

  // Xây dựng dữ liệu StudentLedgerItem
  const ledgerStudents: StudentLedgerItem[] = studentList.map((stud: any) => {
    // Điểm danh
    const studAttendance = (attendanceRecords || []).filter((r: any) => r.student_id === stud.id);
    const attendedCount = studAttendance.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    const absentCount = studAttendance.filter((r: any) => r.status === 'absent').length;
    const effectiveSessions = Math.max(totalClassSessions, studAttendance.length);
    const percentage = effectiveSessions > 0 ? Math.round((attendedCount / effectiveSessions) * 100) : 0;

    // Học phí
    const studInvoices = (classInvoices || [])
      .filter((i: any) => i.student_id === stud.id)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const latestInvoice = studInvoices[0];
    const tuitionStatus = latestInvoice ? (latestInvoice.status as 'paid' | 'sent' | 'overdue') : 'not_created';
    const invoiceAmount = latestInvoice ? Number(latestInvoice.total_amount || 0) : 0;

    // Đánh giá gần nhất
    const studEval = (evaluations || []).find((e: any) => e.student_id === stud.id);

    return {
      id: stud.id,
      fullName: stud.full_name,
      phone: stud.phone || null,
      email: stud.email || null,
      attendance: {
        attendedCount,
        totalSessions: effectiveSessions,
        absentCount,
        percentage
      },
      tuition: {
        status: tuitionStatus,
        amount: invoiceAmount,
        invoiceNumber: latestInvoice ? latestInvoice.invoice_number : null
      },
      evaluation: {
        rating: studEval ? studEval.rating : null,
        feedback: studEval ? studEval.feedback : null
      }
    };
  });

  return (
    <div className="space-y-6">
      {/* 3 Thẻ Thống kê với Dữ liệu Thật 100% */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Thẻ 1: Học sinh */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Học sinh
            </CardTitle>
            <Users className="w-4 h-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {studentCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Đang theo học trong lớp</p>
          </CardContent>
        </Card>
        
        {/* Thẻ 2: Buổi học tới */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Buổi học tới
            </CardTitle>
            <Calendar className="w-4 h-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {nextSessionText}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">{nextSessionSubtext}</p>
          </CardContent>
        </Card>

        {/* Thẻ 3: Tỷ lệ đóng học phí */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tỷ lệ đóng học phí
            </CardTitle>
            <Banknote className="w-4 h-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {tuitionText}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">{tuitionSubtext}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ô Đăng thông báo nhanh cho Lớp học */}
      <ClassAnnouncementBox classId={id} />

      {/* Bảng Tin & Hoạt động gần đây (Chỉ giữ Bài giảng, Tài liệu và Thông báo) */}
      <ClassFeedList classId={id} items={feedItems} />

      {/* Bảng Tổng Hợp Theo Dõi Học Viên 360° (Chuyên cần, Học phí, Đánh giá) */}
      <StudentProgressLedger classId={id} students={ledgerStudents} />
    </div>
  );
}
