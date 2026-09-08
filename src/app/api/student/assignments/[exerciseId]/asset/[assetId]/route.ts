import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubmissionDownloadUrl } from '@/lib/r2/server';

export async function GET(_: Request, { params }: { params: Promise<{ exerciseId: string; assetId: string }> }) {
  try {
    const { exerciseId, assetId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
    if (!student) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    const { data: asset } = await admin
      .from('submission_assets')
      .select('object_key, assignment_submissions!inner(exercise_id, student_id)')
      .eq('id', assetId)
      .maybeSingle();
    const relation = asset?.assignment_submissions as { exercise_id: string; student_id: string } | { exercise_id: string; student_id: string }[] | null;
    const submission = Array.isArray(relation) ? relation[0] : relation;
    if (!asset?.object_key || !submission || submission.exercise_id !== exerciseId || submission.student_id !== student.id) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }
    return NextResponse.redirect(await createSubmissionDownloadUrl(asset.object_key));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể mở tệp' }, { status: 500 });
  }
}
