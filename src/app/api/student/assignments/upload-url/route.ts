import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubmissionUploadUrl } from '@/lib/r2/server';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const { exerciseId, name, contentType, size } = await req.json();
    if (!exerciseId || !name || !contentType || !Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Tệp không hợp lệ hoặc vượt quá 25 MB' }, { status: 400 });
    }
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
    const { data: exercise } = await admin.from('exercises').select('id, class_id').eq('id', exerciseId).maybeSingle();
    if (!student || !exercise) return NextResponse.json({ error: 'Không tìm thấy bài tập hoặc hồ sơ học sinh' }, { status: 404 });
    const { data: enrollment } = await admin.from('enrollments').select('id').eq('class_id', exercise.class_id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle();
    if (!enrollment) return NextResponse.json({ error: 'Bạn không thuộc lớp của bài tập này' }, { status: 403 });
    const safeName = String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const objectKey = `assignments/${exerciseId}/${student.id}/${crypto.randomUUID()}-${safeName}`;
    return NextResponse.json({ objectKey, uploadUrl: await createSubmissionUploadUrl(objectKey, contentType) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo URL tải lên' }, { status: 500 });
  }
}
