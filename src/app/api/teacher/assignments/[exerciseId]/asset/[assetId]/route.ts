import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createSubmissionDownloadUrl } from '@/lib/r2/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ exerciseId: string; assetId: string }> }) {
  try { const { exerciseId, assetId } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 }); const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); const { data: asset } = await admin.from('submission_assets').select('object_key, assignment_submissions!inner(exercise_id, exercises!inner(classes!inner(teacher_id)))').eq('id', assetId).maybeSingle(); if (!asset || (asset.assignment_submissions as any).exercise_id !== exerciseId || (((asset.assignment_submissions as any).exercises as any).classes as any).teacher_id !== user.id) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 }); return NextResponse.redirect(await createSubmissionDownloadUrl(asset.object_key!)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể mở tệp' }, { status: 500 }); }
}
