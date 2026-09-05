import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ScheduleManager } from './ScheduleManager';

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();
  const [slots, classroom] = await Promise.all([
    repos.schedules.findByClassId(classId),
    repos.classes.findById(classId)
  ]);
  
  const plainSlots = slots.map(s => ({
    id: (s as any)._id,
    dayOfWeek: (s as any)._dayOfWeek,
    startTime: (s as any)._startTime,
    endTime: (s as any)._endTime,
    isRecurring: (s as any)._isRecurring
  }));

  if (!classroom) {
    redirect('/teacher/classes');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Thời khóa biểu</h1>
        <p className="text-zinc-500">Quản lý lịch học lặp lại hàng tuần cho lớp <span className="font-semibold text-zinc-700">{classroom.name}</span></p>
      </div>
      
      <ScheduleManager classId={classId} slots={plainSlots} />
    </div>
  );
}
