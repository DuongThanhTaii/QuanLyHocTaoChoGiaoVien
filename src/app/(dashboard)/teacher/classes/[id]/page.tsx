import { createClient } from "@/infrastructure/auth/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Banknote, BookOpenCheck } from "lucide-react";
import { ClassFeedList, FeedItem } from "./components/ClassFeedList";

export default async function ClassOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { createClient: createAdmin } = require("@supabase/supabase-js");
  const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();

  // 1. Thống kê học sinh Active
  const { data: enrollments } = await supabaseAdmin
    .from("enrollments")
    .select("student_id, students(id, full_name, phone, email)")
    .eq("class_id", id)
    .eq("status", "ACTIVE");

  const studentList = (enrollments || [])
    .map((e: any) => e.students)
    .filter(Boolean);
  const studentCount = studentList.length;

  // 2. Tìm buổi học tiếp theo (Buổi học tới)
  // Ưu tiên 1: Tìm trong class_sessions có ngày >= hôm nay
  const { data: nextSessions } = await supabaseAdmin
    .from("class_sessions")
    .select("id, title, session_date, start_time, end_time, room, status")
    .eq("class_id", id)
    .gte("session_date", todayStr)
    .neq("status", "CANCELLED")
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1);

  let nextSessionText = "Chưa có lịch";
  let nextSessionSubtext = "Chưa có buổi học nào sắp tới";

  if (nextSessions && nextSessions.length > 0) {
    const s = nextSessions[0];
    const sDate = new Date(s.session_date);
    const dayNames = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayOfWeek = dayNames[sDate.getDay()];
    const dateFormatted = sDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    const isToday = s.session_date === todayStr;

    const timeRange = `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`;
    nextSessionText = isToday ? "Hôm nay" : `${dayOfWeek}, ${dateFormatted}`;
    nextSessionSubtext = `${timeRange}${s.room ? ` • Phòng ${s.room}` : ""}`;
  } else {
    // Ưu tiên 2: Tính toán từ lịch học định kỳ (schedule_slots)
    const { data: slots } = await supabaseAdmin
      .from("schedule_slots")
      .select("id, day_of_week, start_time, end_time, room")
      .eq("class_id", id);

    if (slots && slots.length > 0) {
      const currentDay = now.getDay();
      // Sắp xếp slot theo ngày gần nhất tiếp theo
      const sortedSlots = [...slots].sort((a, b) => {
        const diffA = (a.day_of_week - currentDay + 7) % 7;
        const diffB = (b.day_of_week - currentDay + 7) % 7;
        return diffA - diffB;
      });

      const nextSlot = sortedSlots[0];
      const dayNames = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      const daysUntil = (nextSlot.day_of_week - currentDay + 7) % 7;
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil));

      const timeRange = `${nextSlot.start_time.substring(0, 5)} - ${nextSlot.end_time.substring(0, 5)}`;
      nextSessionText =
        daysUntil === 0
          ? "Hôm nay"
          : `${dayNames[nextSlot.day_of_week]}, ${targetDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
      nextSessionSubtext = `${timeRange}${nextSlot.room ? ` • Phòng ${nextSlot.room}` : ""}`;
    }
  }

  // 3. Tính toán Tỷ lệ đóng học phí & Công nợ của lớp
  const { data: classInvoices } = await supabaseAdmin
    .from("invoices")
    .select(
      "id, student_id, total_amount, status, period_start, invoice_number, created_at",
    )
    .eq("class_id", id);

  const totalInvoices = (classInvoices || []).length;
  const paidInvoices = (classInvoices || []).filter(
    (i: any) => i.status === "paid",
  );
  const paidCount = paidInvoices.length;
  const paidAmount = paidInvoices.reduce(
    (sum: number, i: any) => sum + Number(i.total_amount || 0),
    0,
  );
  const totalBilledAmount = (classInvoices || []).reduce(
    (sum: number, i: any) => sum + Number(i.total_amount || 0),
    0,
  );

  const tuitionRate =
    totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;
  const tuitionText = totalInvoices > 0 ? `${tuitionRate}%` : "Chưa có HĐ";
  const tuitionSubtext =
    totalInvoices > 0
      ? `Đã thu ${paidAmount.toLocaleString("vi-VN")} đ / ${totalBilledAmount.toLocaleString("vi-VN")} đ`
      : "Chưa phát hành hóa đơn cho lớp";

  // 4. Thống kê Giảng dạy của Giáo viên (Dựa trên số buổi đã điểm danh)
  const { data: pastSessions } = await supabaseAdmin
    .from("class_sessions")
    .select("id, session_date, schedule_slot_id")
    .eq("class_id", id)
    .lte("session_date", todayStr);

  const pastSessionIds = pastSessions?.map((s) => s.id) || [];

  let taughtCount = 0;
  let makeupTaughtCount = 0;

  if (pastSessionIds.length > 0) {
    const { data: attendanceData } = await supabaseAdmin
      .from("attendance_records")
      .select("session_id")
      .in("session_id", pastSessionIds);

    // Find unique sessions that have attendance
    const taughtSessionIds = new Set(
      attendanceData?.map((r: any) => r.session_id),
    );
    taughtCount = taughtSessionIds.size;

    // Count how many of these were makeup (schedule_slot_id is null)
    const taughtMakeupSessions = pastSessions?.filter(
      (s) => taughtSessionIds.has(s.id) && !s.schedule_slot_id,
    );
    makeupTaughtCount = taughtMakeupSessions?.length || 0;
  }

  // Tính nhanh tiền lương dự kiến (Giả định 150k/buổi như trong ảnh)
  const estimatedSalary = taughtCount * 150000;

  // 5. Lấy Bài giảng & Thông báo cho Hoạt động gần đây
  const { data: lessons } = await supabaseAdmin
    .from("lessons")
    .select("id, title, content, created_at, materials(id, name, size_bytes)")
    .eq("class_id", id)
    .order("created_at", { ascending: false })
    .limit(6);

  const feedItems: FeedItem[] = (lessons || []).map((l: any) => ({
    id: l.id,
    type: l.title?.includes("[Thông báo]") ? "announcement" : "lesson",
    title: l.title,
    content: l.content,
    createdAt: l.created_at,
    materials: (l.materials || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      sizeBytes: m.size_bytes || 0,
    })),
  }));

  return (
    <div className="space-y-6">
      {/* 4 Thẻ Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Học sinh */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Học sinh trong lớp
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {studentCount}
            </div>
            <p className="text-xs text-zinc-500">Đang theo học chính thức</p>
          </CardContent>
        </Card>

        {/* Thẻ 2: Buổi học tới */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Buổi học tới
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {nextSessionText}
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {nextSessionSubtext}
            </p>
          </CardContent>
        </Card>

        {/* Thẻ 3: Tỷ lệ đóng học phí */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Tỷ lệ đóng học phí
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {tuitionText}
            </div>
            <p className="text-xs text-zinc-500 truncate">{tuitionSubtext}</p>
          </CardContent>
        </Card>

        {/* Thẻ 4: Thống kê Giảng dạy */}
        <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Số buổi đã dạy
            </span>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-4xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
              {taughtCount}{" "}
              <span className="text-lg font-medium text-zinc-500">buổi</span>
            </div>
            <p className="text-xs text-zinc-500 truncate">
              {makeupTaughtCount > 0
                ? `Bao gồm ${makeupTaughtCount} buổi dạy bù`
                : "Đã chốt điểm danh đầy đủ"}
              {/* Nếu hệ thống có bảng cấu hình lương, có thể thay bằng: Tạm tính: {estimatedSalary.toLocaleString('vi-VN')} đ */}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng Tin & Hoạt động gần đây (Tích hợp luôn ô đăng thông báo) */}
      <ClassFeedList classId={id} items={feedItems} />
    </div>
  );
}
