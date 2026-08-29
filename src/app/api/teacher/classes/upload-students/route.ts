import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { classId, students } = await req.json();

    if (!classId || !students || !Array.isArray(students)) {
      return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
    }

    const repos = await getRepositories();
    const classroom = await repos.classes.findById(classId);

    if (!classroom || classroom.teacherId !== user.id) {
      return NextResponse.json({ success: false, error: 'Class not found or unauthorized' }, { status: 403 });
    }

    const { createClient: createAdminClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let addedCount = 0;

    for (const s of students) {
      const email = s.email?.trim() || null;
      const phone = s.phone?.trim() || null;
      const fullName = s.fullName?.trim();

      if (!fullName) continue;

      // Create standalone student record
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert([{
          full_name: fullName,
          phone: phone,
          email: email,
        }])
        .select()
        .single();

      if (studentError) {
        console.error('Create student error:', studentError);
        continue;
      }

      // Enroll student
      const { error: enrollError } = await supabaseAdmin.from('enrollments').insert({
        class_id: classId,
        student_id: student.id,
        status: 'ACTIVE'
      });

      if (enrollError) {
        console.error('Enroll error:', enrollError);
      } else {
        addedCount++;
      }
    }

    return NextResponse.json({ success: true, count: addedCount });
  } catch (error: any) {
    console.error('Upload students error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
