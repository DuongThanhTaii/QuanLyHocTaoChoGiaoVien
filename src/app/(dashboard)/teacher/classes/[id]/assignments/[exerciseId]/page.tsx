import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { SubmissionManager } from './SubmissionManager';

export default async function AssignmentSubmissionsPage({ params }: { params: Promise<{ id: string; exerciseId: string }> }) {
  const { id: classId, exerciseId } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: exercise } = await admin.from('exercises').select('id, title, classes!inner(teacher_id)').eq('id', exerciseId).eq('class_id', classId).maybeSingle();
  if (!exercise || (exercise.classes as any).teacher_id !== user.id) redirect('/teacher/classes');
  const [{ data: students }, { data: submissions }] = await Promise.all([
    admin.from('enrollments').select('student_id, students!inner(id, full_name)').eq('class_id', classId).eq('status', 'ACTIVE'),
    admin.from('assignment_submissions').select('*, submission_assets(*)').eq('exercise_id', exerciseId),
  ]);
  const roster = (students || []).map((row: any) => row.students);
  const submitted = submissions || [];
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">Bài nộp: {exercise.title}</h1><p className="text-sm text-zinc-500">{submitted.length}/{roster.length} học sinh đã nộp</p></div><SubmissionManager exerciseId={exerciseId} students={roster} submissions={submitted} /></div>;
}
