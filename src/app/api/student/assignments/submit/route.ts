import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { exerciseId, classId, content, attachmentUrl, fileName } = await req.json();

    if (!exerciseId || !classId) {
      return NextResponse.json({ error: 'Thiếu thông tin bài tập hoặc lớp học' }, { status: 400 });
    }

    if (!content?.trim() && !attachmentUrl?.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập nội dung bài làm hoặc đính kèm link bài nộp' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify exercise exists and check due date
    const { data: exercise } = await admin
      .from('exercises')
      .select('id, title, due_date')
      .eq('id', exerciseId)
      .single();

    if (!exercise) {
      return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
    }

    // 2. Fetch student profile to get student name
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const studentDisplayName = profile?.full_name || profile?.email || 'Học sinh';
    const submissionTag = `SUBMISSION:${exerciseId}`;

    // 3. Check if previous submission exists
    const { data: existingSub } = await admin
      .from('materials')
      .select('id')
      .eq('class_id', classId)
      .eq('uploaded_by', user.id)
      .eq('file_type', submissionTag)
      .maybeSingle();

    const submissionData = {
      name: `[Bài nộp] ${exercise.title} - ${studentDisplayName}`,
      storage_path: attachmentUrl || content || 'Đã nộp bài',
      file_type: submissionTag,
      size_bytes: null,
      class_id: classId,
      uploaded_by: user.id,
    };

    if (existingSub) {
      await admin
        .from('materials')
        .update(submissionData)
        .eq('id', existingSub.id);
    } else {
      await admin
        .from('materials')
        .insert(submissionData);
    }

    return NextResponse.json({
      success: true,
      message: 'Nộp bài tập thành công!',
    });
  } catch (error: any) {
    console.error('Lỗi nộp bài tập:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi nộp bài' }, { status: 500 });
  }
}
