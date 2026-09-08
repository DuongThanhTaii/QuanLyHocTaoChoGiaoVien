import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createSubmissionUploadUrl } from '@/lib/r2/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const { name, contentType } = await req.json();
    if (!name) return NextResponse.json({ error: 'Tên tệp không hợp lệ' }, { status: 400 });
    const safeName = String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
    const objectKey = `teacher-content/${user.id}/${crypto.randomUUID()}-${safeName}`;
    return NextResponse.json({ objectKey, uploadUrl: await createSubmissionUploadUrl(objectKey, contentType || 'application/octet-stream') });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể chuẩn bị tải tệp' }, { status: 500 });
  }
}
