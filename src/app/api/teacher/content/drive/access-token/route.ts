import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { getGoogleAccessToken } from '@/lib/google-drive/server';

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  try { return NextResponse.json({ accessToken: await getGoogleAccessToken(getServiceClient(), user.id) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể kết nối Drive.' }, { status: 401 }); }
}
