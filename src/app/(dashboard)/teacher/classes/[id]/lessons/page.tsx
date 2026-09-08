import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { ClassLessonsClient } from './ClassLessonsClient';

export default async function TeacherLessonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch current class
  const { data: currentClass } = await admin
    .from('classes')
    .select('id, name, subject, color, teacher_id')
    .eq('id', id)
    .single();

  if (!currentClass) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Không tìm thấy lớp học.
      </div>
    );
  }

  // 2. Fetch all classes of this teacher (for modal dropdown)
  const { data: teacherClassesData } = await admin
    .from('classes')
    .select('id, name, subject, color')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const teacherClasses = teacherClassesData || [];
  const teacherClassIds = teacherClasses.map((c) => c.id);

  // Actual generated sessions are passed to the assignment form, so teachers can
  // attach an exercise to the exact lesson in the month they choose.
  const { data: sessionsData } = teacherClassIds.length
    ? await admin.from('class_sessions')
      .select('id, class_id, session_date, start_time, end_time')
      .in('class_id', teacherClassIds)
      .order('session_date', { ascending: true })
    : { data: [] as Array<{ id: string; class_id: string; session_date: string; start_time: string | null; end_time: string | null }> };
  const scheduleTargets = (sessionsData || []).reduce<Record<string, Array<{ id: string; type: 'session'; label: string; month: string }>>>((targets, session) => {
    const date = new Date(`${session.session_date}T00:00:00`);
    const day = Number.isNaN(date.getTime()) ? session.session_date : date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = session.start_time ? ` · ${session.start_time.slice(0, 5)}${session.end_time ? `–${session.end_time.slice(0, 5)}` : ''}` : '';
    (targets[session.class_id] ||= []).push({ id: session.id, type: 'session', label: `${day}${time}`, month: session.session_date.slice(0, 7) });
    return targets;
  }, {});

  // 3. Fetch lessons for this class with materials
  const { data: lessonsData } = await admin
    .from('lessons')
    .select('id, class_id, title, content, created_at, materials(*)')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  // 4. Fetch exercises for this class
  const { data: exercisesData } = await admin
    .from('exercises')
    .select('id, class_id, title, description, due_date, max_score, attachments, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  const exerciseIds = (exercisesData || []).map((exercise) => exercise.id);
  const [{ data: activeEnrollments }, { data: submissionRows }] = await Promise.all([
    admin.from('enrollments').select('student_id').eq('class_id', id).eq('status', 'ACTIVE'),
    exerciseIds.length
      ? admin.from('assignment_submissions').select('exercise_id, student_id').in('exercise_id', exerciseIds)
      : Promise.resolve({ data: [] }),
  ]);
  const activeStudentIds = new Set((activeEnrollments || []).map((enrollment: any) => enrollment.student_id));
  const activeStudentCount = activeStudentIds.size;
  const submissionStats = (submissionRows || []).filter((row: any) => activeStudentIds.has(row.student_id)).reduce<Record<string, { submitted: number; total: number }>>((stats, row: any) => {
    stats[row.exercise_id] = { submitted: (stats[row.exercise_id]?.submitted || 0) + 1, total: activeStudentCount };
    return stats;
  }, {});
  exerciseIds.forEach((exerciseId) => { submissionStats[exerciseId] ||= { submitted: 0, total: activeStudentCount }; });

  // 5. Fetch library materials (de-duplicated) for "Chọn từ Kho Drive"
  let libraryMaterials: any[] = [];
  if (teacherClassIds.length > 0) {
    const { data: matData } = await admin
      .from('materials')
      .select('*')
      .in('class_id', teacherClassIds)
      .order('created_at', { ascending: false });

    const seen = new Set<string>();
    libraryMaterials = (matData || []).filter((m) => {
      const key = m.storage_path || m.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return (
    <ClassLessonsClient
      classId={id}
      classes={teacherClasses}
      lessons={lessonsData || []}
      exercises={exercisesData || []}
      libraryMaterials={libraryMaterials}
      submissionStats={submissionStats}
      scheduleTargets={scheduleTargets}
    />
  );
}
