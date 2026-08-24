import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Thời khóa biểu</h1>
      <p className="text-gray-600 mb-6">Quản lý lịch học lặp lại hàng tuần cho lớp {classId}</p>
      
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
              
              <button className="text-xs text-gray-500 hover:text-blue-600 w-full text-center mt-2">
                + Thêm
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
