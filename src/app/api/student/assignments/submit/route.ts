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

    const { exerciseId, note, assets } = await req.json();

    if (!exerciseId || !Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json({ error: 'Vui lòng đính kèm ít nhất một file, ảnh hoặc link' }, { status: 400 });
    }

    if (assets.length > 10) {
      return NextResponse.json({ error: 'Mỗi bài nộp tối đa 10 mục đính kèm' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify exercise exists and check due date
    const { data: exercise } = await admin
      .from('exercises')
      .select('id, class_id, due_date')
      .eq('id', exerciseId)
      .single();

    if (!exercise) {
      return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
    }

    const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: 'Không tìm thấy hồ sơ học sinh' }, { status: 404 });
    const { data: enrollment } = await admin.from('enrollments').select('id').eq('class_id', exercise.class_id).eq('student_id', student.id).eq('status', 'ACTIVE').maybeSingle();
    if (!enrollment) return NextResponse.json({ error: 'Bạn không thuộc lớp của bài tập này' }, { status: 403 });
    const isLate = !!exercise.due_date && new Date(exercise.due_date).getTime() < Date.now();
    const { data: submission, error: submissionError } = await admin.from('assignment_submissions').upsert({
      exercise_id: exerciseId, student_id: student.id, note: typeof note === 'string' ? note.trim() || null : null,
      is_late: isLate, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'exercise_id,student_id' }).select('id').single();
    if (submissionError || !submission) throw new Error(submissionError?.message || 'Không thể lưu bài nộp');
    await admin.from('submission_assets').delete().eq('submission_id', submission.id);
    const cleanAssets = assets.map((asset: any) => ({
      submission_id: submission.id, kind: asset.kind === 'link' ? 'link' : asset.kind === 'image' ? 'image' : 'file',
      name: String(asset.name || 'Tệp bài nộp').slice(0, 255), object_key: asset.kind === 'link' ? null : asset.objectKey,
      external_url: asset.kind === 'link' ? asset.url : null, content_type: asset.contentType || null,
      size_bytes: Number.isFinite(asset.size) ? asset.size : null,
    }));
    if (cleanAssets.some((asset: any) => (asset.kind === 'link' && !asset.external_url) || (asset.kind !== 'link' && !asset.object_key))) {
      return NextResponse.json({ error: 'Tệp đính kèm không hợp lệ' }, { status: 400 });
    }
    const { error: assetsError } = await admin.from('submission_assets').insert(cleanAssets);
    if (assetsError) throw new Error(assetsError.message);

    return NextResponse.json({
      success: true,
      message: isLate ? 'Đã nộp bài muộn thành công!' : 'Nộp bài tập thành công!',
      submissionId: submission.id,
    });
  } catch (error: any) {
    console.error('Lỗi nộp bài tập:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống khi nộp bài' }, { status: 500 });
  }
}
