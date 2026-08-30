import { ScheduleCalendar, ScheduleSlot } from '@/components/shared/calendar/ScheduleCalendar';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function StudentSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch student entity
  const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).single();

  let slots: ScheduleSlot[] = [];

  if (student) {
    // Fetch enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', student.id)
      .is('left_at', null);

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id);
      const { data: classes } = await supabase
        .from('classes')
        .select('id, class_code, class_name:name')
        .in('id', classIds);

      const { data: scheduleSlots } = await supabase
        .from('schedule_slots')
        .select('*')
        .in('class_id', classIds);

      if (scheduleSlots && classes) {
        slots = scheduleSlots.map(slot => {
          const cls = classes.find(c => c.id 
=== slot.class_id);
          return {
            ...slot,
            classes: cls ? { id: cls.id, class_code: cls.class_code || '', class_name: cls.class_name } : null
          } as ScheduleSlot;
        });
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="mb-4">
        <h1 className="text-rxl font-bold tracking-tight text.zinc-900">Thời khóa biểu học tập</h1>
        <p className="text-zinc-500">Lịch học các lop của bạn trong tuần.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ScheduleCalendar slots={slots} userRole="student" />
      </div>
    </div>
  );
}
