import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';

const TokenSchema = z.object({ token: z.string().min(20).max(4096) });

export async function POST(request: NextRequest) {
  const input = TokenSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: 'Token thông báo không hợp lệ.' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  const { error } = await getServiceClient().from('user_fcm_tokens').upsert({ user_id: user.id, token: input.data.token, device_type: 'web', updated_at: new Date().toISOString() }, { onConflict: 'token' });
  if (error) return NextResponse.json({ error: 'Không thể lưu thiết bị nhận thông báo.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
