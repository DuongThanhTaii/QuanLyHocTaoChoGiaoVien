import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { addScheduleSlot } from './actions';

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();
  const slots = await repos.schedules.findByClassId(classId);
  
  // days array for mapping
  const days = [
    { label: 'T2', index: 1 },
    { label: 'T3', index: 2 },
    { label: 'T4', index: 3 },
    { label: 'T5', index: 4 },
    { label: 'T6', index: 5 },
    { label: 'T7', index: 6 },
    { label: 'CN', index: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thời khóa biểu</h1>
        <p className="text-zinc-500">Quản lý lịch học lặp lại hàng tuần cho lớp {classId}</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const daySlots = slots.filter((s: any) => (s._dayOfWeek ?? s.dayOfWeek) === day.index);
          
          return (
            <div key={day.label} className="border rounded p-2 min-h-24 bg-gray-50">
              <div className="font-bold text-center border-b pb-1 mb-2 text-gray-700">{day.label}</div>
              
              {daySlots.map((slot: any) => (
                <div key={slot._id || slot.id} className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1 text-center truncate" title={`${slot._startTime || slot.startTime} - ${slot._endTime || slot.endTime}`}>
                  {(slot._startTime || slot.startTime).substring(0, 5)} - {(slot._endTime || slot.endTime).substring(0, 5)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Thêm lịch học</h2>
        <form action={addScheduleSlot as any} className="flex gap-4 items-end">
          <input type="hidden" name="classId" value={classId} />
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Thứ</label>
            <select name="dayOfWeek" className="border rounded p-2 bg-white" required>
              <option value="1">Thứ 2</option>
              <option value="2">Thứ 3</option>
              <option value="3">Thứ 4</option>
              <option value="4">Thứ 5</option>
              <option value="5">Thứ 6</option>
              <option value="6">Thứ 7</option>
              <option value="0">Chủ Nhật</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Giờ bắt đầu</label>
            <input type="time" name="startTime" className="border rounded p-2 bg-white" required />
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Giờ kết thúc</label>
            <input type="time" name="endTime" className="border rounded p-2 bg-white" required />
          </div>
          
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Thêm
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
