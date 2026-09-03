import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { EvaluationManager } from './EvaluationManager';

export default async function ClassEvaluationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  const resolvedSearchParams = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();

  // Fetch enrolled students
  const enrollments = await repos.enrollments.findActiveByClass(classId);

  // Fetch student profiles from students table
  const studentIds = enrollments.map((e: any) => e._studentId || e.studentId);
  const { data: profiles } = await supabase
    .from('students')
    .select('id, full_name')
    .in('id', studentIds.length ? studentIds : ['dummy-id']);

  const students = enrollments.map((e: any) => {
    const sid = e._studentId || e.studentId;
    const profile = profiles?.find((p: any) => p.id === sid);
    return {
      id: sid,
      name: profile?.full_name || 'Không rõ tên'
    };
  });

  const { data: allSlots } = await supabase.from('schedule_slots').select('day_of_week').eq('class_id', classId);
  const scheduleDays = allSlots?.map((slot) => slot.day_of_week) || [];
  const fallbackDate = new Date().toISOString().split('T')[0];
  const dateStr = resolvedSearchParams.date || fallbackDate;
  const selectedDate = new Date(dateStr);
  const selectedDayOfWeek = selectedDate.getDay();
  const { data: slot } = await supabase
    .from('schedule_slots')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('day_of_week', selectedDayOfWeek)
    .limit(1)
    .maybeSingle();
  const isScheduled = scheduleDays.includes(selectedDayOfWeek);

  // Find or create the session for the selected date. Makeup sessions are created explicitly in the client.
  let { data: session } = await supabase
    .from('class_sessions')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('session_date', dateStr)
    .maybeSingle();

  if (!session && slot && isScheduled) {
    const { data: newSession } = await supabase
      .from('class_sessions')
      .insert({
        class_id: classId,
        schedule_slot_id: slot.id,
        title: 'Buổi học ' + new Date().toLocaleDateString('vi-VN'),
        session_date: dateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: 'SCHEDULED'
      })
      .select('id, start_time, end_time')
      .single();

    session = newSession;
  }

  const sessionId = session?.id || '';
  const timeRange = session ? `${session.start_time} - ${session.end_time}` : 'Không có lịch học';

  // Fetch existing evaluation records for this session using admin
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: existingRecords } = sessionId ? await admin
    .from('session_evaluations')
    .select('student_id, rating, feedback')
    .eq('session_id', sessionId) : { data: [] };

  const initialEvaluations = (existingRecords || []).reduce((acc: any, record: any) => {
    acc[record.student_id] = { rating: record.rating, feedback: record.feedback || '' };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <EvaluationManager
        classId={classId}
        sessionId={sessionId}
        students={students}
        dateString={selectedDate.toLocaleDateString('vi-VN')}
        timeRange={timeRange}
        selectedDateStr={dateStr}
        isScheduled={isScheduled}
        scheduleDays={scheduleDays}
        initialEvaluations={initialEvaluations}
      />
    </div>
  );
}
