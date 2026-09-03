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

  // 4. Fetch student's submissions for this class
  const { data: submissionsData } = await admin
    .from('materials')
    .select('id, name, storage_path, file_type, created_at')
    .eq('class_id', id)
    .eq('uploaded_by', user.id)
    .like('file_type', 'SUBMISSION:%');

  const mySubmissions: Record<string, any> = {};
  (submissionsData || []).forEach((sub) => {
    const exId = sub.file_type.replace('SUBMISSION:', '');
    mySubmissions[exId] = sub;
  });

  return (
    <StudentLessonsClient
      classId={id}
      className={currentClass.name}
      classSubject={currentClass.subject}
      lessons={lessonsData || []}
      exercises={exercisesData || []}
      mySubmissions={mySubmissions}
    />
  );
}
