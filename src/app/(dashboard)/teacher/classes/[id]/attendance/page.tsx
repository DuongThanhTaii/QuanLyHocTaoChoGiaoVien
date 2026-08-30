import { markAttendance } from '../../attendance-actions';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { AttendanceManager } from './AttendanceManager';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  
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

  // Find or create today's session
  const dateStr = new Date().toISOString().split('T')[0];
  let { data: session } = await supabase
    .from('class_sessions')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('session_date', dateStr)
    .maybeSingle();

  if (!session) {
    // Try to find today's schedule slot to get default times
    const currentDay = new Date().getDay(); // 0-6
    const { data: slot } = await supabase
      .from('schedule_slots')
      .select('id, start_time, end_time')
      .eq('class_id', classId)
      .eq('day_of_week', currentDay)
      .limit(1)
      .maybeSingle();

    // Create session
    const { data: newSession } = await supabase
      .from('class_sessions')
      .insert({
        class_id: classId,
        schedule_slot_id: slot?.id || null,
        title: 'Buổi học ' + new Date().toLocaleDateString('vi-VN'),
        session_date: dateStr,
        start_time: slot?.start_time || '00:00:00',
        end_time: slot?.end_time || '23:59:59',
        status: 'SCHEDULED'
      })
      .select('id, start_time, end_time')
      .single();
    
    session = newSession;
  }

  const slotId = session?.id || 'uuid-slot-123'; // passed down as slotId to avoid refactoring UI/props
  const timeRange = session ? `${session.start_time} - ${session.end_time}` : 'Không có lịch học (Ngoài giờ)';

  // Fetch existing attendance records for this session using admin to bypass missing RLS
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

  return (
    <div className="space-y-6">
      <AttendanceManager 
        classId={classId}
        slotId={slotId}
        students={students}
        dateString={new Date().toLocaleDateString('vi-VN')}
        timeRange={timeRange}
        initialAttendance={initialAttendance}
      />
    </div>
  );
}
