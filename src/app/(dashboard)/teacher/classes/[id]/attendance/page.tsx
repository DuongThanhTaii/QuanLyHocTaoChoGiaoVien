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

  // Try to find today's slot
  const currentDay = new Date().getDay(); // 0-6
  const { data: slot } = await supabase
    .from('schedule_slots')
    .select('id, start_time, end_time')
    .eq('class_id', classId)
    .eq('day_of_week', currentDay)
    .limit(1)
    .single();

  // In the future, this should point to class_sessions. 
  // For now we keep slotId to avoid breaking everything before implementing schedule logic fully.
  const slotId = slot?.id || 'uuid-slot-123';
  const timeRange = slot ? `${slot.start_time} - ${slot.end_time}` : 'Không có lịch học (Ngoài giờ)';

  return (
    <div className="space-y-6">
      <AttendanceManager 
        classId={classId}
        slotId={slotId}
        students={students}
        dateString={new Date().toLocaleDateString('vi-VN')}
        timeRange={timeRange}
      />
    </div>
  );
}
