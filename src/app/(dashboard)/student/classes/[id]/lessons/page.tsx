import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { StudentLessonsClient } from './StudentLessonsClient';

export default async function StudentLessonsPage({
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

  // 1. Fetch class info
  const { data: currentClass } = await admin
    .from('classes')
    .select('id, name, subject')
    .eq('id', id)
    .single();

  if (!currentClass) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Không tìm thấy lớp học.
      </div>
    );
  }

  // 2. Fetch lessons with attached materials
  const { data: lessonsData } = await admin
    .from('lessons')
    .select('id, title, content, created_at, materials(id, name, storage_path, file_type, size_bytes)')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  // 3. Fetch exercises for this class
  const { data: exercisesData } = await admin
    .from('exercises')
    .select('id, class_id, title, description, due_date, max_score, attachments, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false });

  // 4. Fetch the student's normalized submissions and assets.
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: submissionsData } = student ? await admin
    .from('assignment_submissions')
    .select('id, exercise_id, note, is_late, score, teacher_feedback, submitted_at, submission_assets(*)')
    .eq('student_id', student.id) : { data: [] };

  const mySubmissions: Record<string, any> = {};
  (submissionsData || []).forEach((sub: any) => { mySubmissions[sub.exercise_id] = sub; });

  return (
    <StudentLessonsClient
      classId={id}
      lessons={lessonsData || []}
      exercises={exercisesData || []}
      mySubmissions={mySubmissions}
    />
  );
}
