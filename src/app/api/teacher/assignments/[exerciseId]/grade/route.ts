import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ exerciseId: string }> }) {
  try {
    const { exerciseId } = await params;
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const { submissionId, score, feedback } = await req.json();
    if (!submissionId || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 10) return NextResponse.json({ error: 'Điểm phải nằm trong khoảng 0–10' }, { status: 400 });
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: exercise } = await admin.from('exercises').select('id, class_id, classes!inner(teacher_id)').eq('id', exerciseId).maybeSingle();
    if (!exercise || (exercise.classes as any).teacher_id !== user.id) return NextResponse.json({ error: 'Bạn không có quyền chấm bài này' }, { status: 403 });
    const { error } = await admin.from('assignment_submissions').update({ score: Number(score), teacher_feedback: typeof feedback === 'string' ? feedback.trim() || null : null, graded_at: new Date().toISOString(), graded_by: user.id }).eq('id', submissionId).eq('exercise_id', exerciseId);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể chấm bài' }, { status: 500 }); }
}
