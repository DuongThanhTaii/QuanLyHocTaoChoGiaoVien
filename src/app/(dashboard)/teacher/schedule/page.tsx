import { ScheduleCalendar, ScheduleSlot } from '@/components/shared/calendar/ScheduleCalendar';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function TeacherSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch classes for teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id);

  let slots: ScheduleSlot[] = [];

  if (classes && classes.length > 0) {
    const classIds = classes.map(c => c.id);
    const { data: scheduleSlots } = await supabase
      .from('schedule_slots')
      .select('*')
      .in('class_id', classIds);

    if (scheduleSlots) {
      slots = scheduleSlots.map(slot => {
        const cls = classes.find(c => c.id === slot.class_id);
        return {
          ...slot,
          classes: cls ? { id: cls.id, name: cls.name || '' } : null
        } as ScheduleSlot;
      });
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Thời khóa biểu tổng</h1>
        <p className="text-zinc-500">Lịch giảng dạy tất cả các lớp của bạn trong tuần.</p>
      </div>
      <div data-tour-id="teacher-schedule">
        <ScheduleCalendar slots={slots} userRole="teacher" />
      </div>
    </div>
  );
}
