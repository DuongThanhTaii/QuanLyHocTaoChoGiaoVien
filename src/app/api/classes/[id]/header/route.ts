import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getServiceClient();
  const { data: classroom } = await admin.from('classes').select('name, teacher_id').eq('id', id).maybeSingle();
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacher_id === user.id) return NextResponse.json({ name: classroom.name });

  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: enrollment } = student
    ? await admin.from('enrollments').select('id').eq('class_id', id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle()
    : { data: null };
  if (!enrollment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ name: classroom.name });
}
