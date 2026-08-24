import { markAttendance } from '../../attendance-actions';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

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
  
  // Fetch student profiles
  const studentIds = enrollments.map((e: any) => e._studentId || e.studentId);
  const { data: profiles } = await supabase
    .from('profiles')
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

  const slotId = slot?.id || 'uuid-slot-123';
  const timeRange = slot ? `${slot.start_time} - ${slot.end_time}` : 'Không có lịch học (Ngoài giờ)';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Điểm danh lớp học</h1>
      <div className="bg-gray-50 p-4 rounded mb-6 flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-700">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
          <p className="text-sm text-gray-500">Giờ học: {timeRange}</p>
        </div>
      </div>

      <div className="space-y-4">
        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có học sinh nào trong lớp
          </div>
        ) : (
          students.map((student: any) => (
            <form action={markAttendance} key={student.id} className="flex items-center justify-between border-b pb-4">
              <input type="hidden" name="classId" value={classId} />
              <input type="hidden" name="studentId" value={student.id} />
              <input type="hidden" name="slotId" value={slotId} />
              
              <div className="font-medium text-gray-800">{student.name}</div>
              
              <div className="flex gap-4 items-center">
                <select name="status" className="border rounded px-2 py-1 text-sm bg-white" defaultValue="present">
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng mặt</option>
                  <option value="late">Đi trễ</option>
                  <option value="excused">Có phép</option>
                </select>
                
                <input 
                  type="text" 
                  name="note" 
                  placeholder="Ghi chú..." 
                  className="border rounded px-2 py-1 text-sm w-32"
                />
                
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Lưu
                </button>
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
