import { ScheduleCalendar, ScheduleSlot } from '@/components/shared/calendar/ScheduleCalendar';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function TeacherSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch classes for teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, location, online_meeting_url')
    .eq('teacher_id', user.id);

  let slots: ScheduleSlot[] = [];

  if (classes && classes.length > 0) {
    const classIds = classes.map(c => c.id);
    const { data: scheduleSlots } = await supabase
      .from('schedule_slots')
      .select('*')
      .in('class_id', classIds);

    if (scheduleSlots) {
      const [{ data: sessions }, { data: exercises }] = await Promise.all([
        supabase.from('class_sessions').select('id, schedule_slot_id, session_date').in('class_id', classIds).neq('status', 'CANCELLED'),
        supabase.from('exercises').select('id, title, session_id').in('class_id', classIds).not('session_id', 'is', null)
      ]);
      const sessionById = new Map((sessions || []).map((session) => [session.id, session]));
      const assignmentsBySlot = new Map<string, Array<{ id: string; title: string; sessionDate: string }>>();
      (exercises || []).forEach((exercise) => {
        const session = exercise.session_id ? sessionById.get(exercise.session_id) : null;
        if (!session?.schedule_slot_id || !session.session_date) return;
        assignmentsBySlot.set(session.schedule_slot_id, [...(assignmentsBySlot.get(session.schedule_slot_id) || []), { id: exercise.id, title: exercise.title, sessionDate: session.session_date }]);
      });
      slots = scheduleSlots.map(slot => {
        const cls = classes.find(c => c.id === slot.class_id);
        return {
          ...slot,
          assignments: assignmentsBySlot.get(slot.id) || [],
          classes: cls ? { id: cls.id, name: cls.name || '', location: cls.location, online_meeting_url: cls.online_meeting_url } : null
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
