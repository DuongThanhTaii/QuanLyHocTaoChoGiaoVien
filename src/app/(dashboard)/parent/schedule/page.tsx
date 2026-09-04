import { ScheduleCalendar, ScheduleSlot } from '@/components/shared/calendar/ScheduleCalendar';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function ParentSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch parent entity
  const { data: guardian } = await supabase.from('guardians').select('id').eq('user_id', user.id).single();

  let slots: ScheduleSlot[] = [];

  if (guardian) {
    // Fetch students for this parent
    const { data: studentGuardians } = await supabase
      .from('student_guardians')
      .select('student_id')
      .eq('guardian_id', guardian.id);

    if (studentGuardians && studentGuardians.length > 0) {
      const studentIds = studentGuardians.map(sg => sg.student_id);

      // Find all enrollments for these students
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('student_id', studentIds)
        .is('left_at', null);

      if (enrollments && enrollments.length > 0) {
        const classIds = enrollments.map(e => e.class_id);
        const { data: classes } = await supabase
          .from('classes')
          .select('id, name')
          .in('id', classIds);

        const { data: scheduleSlots } = await supabase
          .from('schedule_slots')
          .select('*')
          .in('class_id', classIds);

        if (scheduleSlots && classes) {
          slots = scheduleSlots.map(slot => {
            const cls = classes.find(c => c.id === slot.class_id);
            return {
              ...slot,
              classes: cls ? { id: cls.id, name: cls.name || '' } : null
            } as ScheduleSlot;
          });
        }
      }
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thời khóa biểu của con</h1>
        <p className="text-zinc-500">Theo dõi lịch học các lớp của con trong tuần.</p>
      </div>
      <div>
        <ScheduleCalendar slots={slots} userRole="parent" />
      </div>
    </div>
  );
}
