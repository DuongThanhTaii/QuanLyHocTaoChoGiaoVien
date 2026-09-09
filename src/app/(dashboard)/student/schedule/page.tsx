import { ScheduleCalendar, ScheduleSlot } from '@/components/shared/calendar/ScheduleCalendar';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function StudentSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch student entity
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();

  let slots: ScheduleSlot[] = [];

  if (student) {
    // Fetch enrollments
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('class_id')
      .eq('student_id', student.id)
      .eq('status', 'ACTIVE');

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map((e: any) => e.class_id);
      const { data: classes } = await admin
        .from('classes')
        .select('id, name, location, online_meeting_url')
        .in('id', classIds);

      const { data: scheduleSlots } = await admin
        .from('schedule_slots')
        .select('*')
        .in('class_id', classIds);

      if (scheduleSlots && classes) {
        const [{ data: sessions }, { data: exercises }] = await Promise.all([
          admin.from('class_sessions').select('id, schedule_slot_id, session_date').in('class_id', classIds).neq('status', 'CANCELLED'),
          admin.from('exercises').select('id, title, session_id').in('class_id', classIds).not('session_id', 'is', null)
        ]);
        const sessionById = new Map((sessions || []).map((session: any) => [session.id, session]));
        const assignmentsBySlot = new Map<string, Array<{ id: string; title: string; sessionDate: string }>>();
        (exercises || []).forEach((exercise: any) => {
          const session = exercise.session_id ? sessionById.get(exercise.session_id) : null;
          if (!session?.schedule_slot_id || !session.session_date) return;
          assignmentsBySlot.set(session.schedule_slot_id, [...(assignmentsBySlot.get(session.schedule_slot_id) || []), { id: exercise.id, title: exercise.title, sessionDate: session.session_date }]);
        });
        slots = scheduleSlots.map((slot: any) => {
          const cls = classes.find((c: any) => c.id === slot.class_id);
          return {
            ...slot,
            assignments: assignmentsBySlot.get(slot.id) || [],
            classes: cls ? { id: cls.id, name: cls.name || '', location: cls.location, online_meeting_url: cls.online_meeting_url } : null
          } as ScheduleSlot;
        });
      }
    }
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thời khóa biểu học tập</h1>
        <p className="text-zinc-500">Lịch học các lớp của bạn trong tuần.</p>
      </div>
      <div>
        <ScheduleCalendar slots={slots} userRole="student" />
      </div>
    </div>
  );
}
