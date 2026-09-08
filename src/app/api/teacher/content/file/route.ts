import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createSubmissionDownloadUrl } from '@/lib/r2/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const key = req.nextUrl.searchParams.get('key');
  if (!user || !key || !key.startsWith('teacher-content/')) return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  return NextResponse.redirect(await createSubmissionDownloadUrl(key));
}
