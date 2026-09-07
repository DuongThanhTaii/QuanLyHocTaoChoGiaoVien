import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ScheduleManager } from './ScheduleManager';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Link from 'next/link';

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

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: scheduledAssignments } = await admin
    .from('exercises')
    .select('id, title, due_date, session_id, schedule_slot_id')
    .eq('class_id', classId)
    .or('session_id.not.is.null,schedule_slot_id.not.is.null')
    .order('due_date');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Thời khóa biểu</h1>
        <p className="text-zinc-500">Quản lý lịch học lặp lại hàng tuần cho lớp <span className="font-semibold text-zinc-700">{classroom.name}</span></p>
      </div>
      {(scheduledAssignments || []).length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">Bài tập đã gắn vào thời khóa biểu</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(scheduledAssignments || []).map((assignment: any) => <Link key={assignment.id} href={`/teacher/classes/${classId}/assignments/${assignment.id}`} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-200">{assignment.title}{assignment.due_date ? ` · hạn ${new Date(assignment.due_date).toLocaleDateString('vi-VN')}` : ''}</Link>)}
          </div>
        </section>
      )}
      
      <ScheduleManager classId={classId} slots={plainSlots} />
    </div>
  );
}
