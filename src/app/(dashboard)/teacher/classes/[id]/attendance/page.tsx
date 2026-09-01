import { markAttendance } from '../../attendance-actions';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { AttendanceManager } from './AttendanceManager';

export default async function AttendancePage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ date?: string }> }) {
  const resolvedParams = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const classId = resolvedParams.id;
  
  // Use date from URL search query, or default to today
  const selectedDateStr = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();
  
  // Fetch enrolled students
  const enrollments = await repos.enrollments.findActiveByClass(classId);
  
  // Fetch student profiles from new students table
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

  // Find or create session for the SELECTED date
  let { data: session } = await supabase
    .from('class_sessions')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('session_date', selectedDateStr)
    .maybeSingle();

  const selectedDateObj = new Date(selectedDateStr);
  const selectedDayOfWeek = selectedDateObj.getDay();

  // Check if there is a schedule slot for this day
  const { data: slot } = await supabase
    .from('schedule_slots')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('day_of_week', selectedDayOfWeek)
    .limit(1)
    .maybeSingle();

  if (!session && slot) {
    // Only auto-create session if there is a scheduled slot for this day!
    const { data: newSession } = await supabase
      .from('class_sessions')
      .insert({
        class_id: classId,
        schedule_slot_id: slot.id,
        title: 'Buổi học ' + selectedDateObj.toLocaleDateString('vi-VN'),
        session_date: selectedDateStr,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: 'SCHEDULED'
      })
      .select('id, start_time, end_time')
      .single();
    
    session = newSession;
  }

  const isScheduled = !!slot || !!session;
  const slotId = session?.id || 'uuid-slot-123';
  const timeRange = session ? `${session.start_time} - ${session.end_time}` : 'Không có lịch học (Ngoài giờ)';

  // Fetch existing attendance records
  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: existingRecords } = await admin
    .from('attendance_records')
    .select('student_id, status, note')
    .eq('session_id', slotId);

  const initialAttendance = (existingRecords || []).reduce((acc: any, record: any) => {
    acc[record.student_id] = { status: record.status, note: record.note || '' };
    return acc;
  }, {});

  // Fetch schedule slots to build the date selector list
  const { data: allSlots } = await supabase
    .from('schedule_slots')
    .select('day_of_week')
    .eq('class_id', classId);
    
  const scheduleDays = allSlots?.map(s => s.day_of_week) || [];

  return (
    <div className="space-y-6">
      <AttendanceManager 
        classId={classId}
        slotId={slotId}
        students={students}
        selectedDateStr={selectedDateStr}
        isScheduled={isScheduled}
        scheduleDays={scheduleDays}
        timeRange={timeRange}
        initialAttendance={initialAttendance}
      />
    </div>
  );
}
