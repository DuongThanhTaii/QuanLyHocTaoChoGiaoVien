import { markAttendance } from '../../attendance-actions';

// Note: In Next.js App Router, params is a Promise in Next.js 15
export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  
  // Fetch from DB:
  // const slot = await getTodaySlot(classId);
  // const students = await getEnrolledStudents(classId);
  // const records = await getAttendanceRecords(slot.id);

  // Mock data
  const students = [
    { id: 's1', name: 'Nguyễn Văn A' },
    { id: 's2', name: 'Trần Thị B' },
    { id: 's3', name: 'Lê Văn C' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Điểm danh lớp học</h1>
      <div className="bg-gray-50 p-4 rounded mb-6 flex justify-between items-center">
        <div>
          <p className="font-semibold text-gray-700">Ngày: {new Date().toLocaleDateString('vi-VN')}</p>
          <p className="text-sm text-gray-500">Giờ học: 18:00 - 19:30</p>
        </div>
      </div>

      <div className="space-y-4">
        {students.map(student => (
          <form action={markAttendance} key={student.id} className="flex items-center justify-between border-b pb-4">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="slotId" value="uuid-slot-123" />
            
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
        ))}
      </div>
    </div>
  );
}
