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
      className={currentClass.name}
      classSubject={currentClass.subject}
      classes={teacherClasses}
      lessons={lessonsData || []}
      exercises={exercisesData || []}
      libraryMaterials={libraryMaterials}
    />
  );
}
