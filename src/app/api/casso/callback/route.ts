import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { cassoApi, decryptCassoSecret, encryptCassoSecret, exchangeCassoCode, verifyCassoState } from '@/lib/casso/server';
import { getServiceClient } from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/profile?casso_error=${encodeURIComponent(reason)}`, origin));
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const storedState = request.cookies.get('mari_casso_state')?.value;
  const verified = state && storedState === state ? verifyCassoState(state) : null;
  if (!code || !verified) return fail('Phiên kết nối Casso không hợp lệ hoặc đã hết hạn.');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== verified.teacherId) return fail('Vui lòng đăng nhập lại trước khi kết nối Casso.');

  try {
    const token = await exchangeCassoCode(code, `${origin}/api/casso/callback`);
    const userInfo = await cassoApi<{ user?: { id?: string | number } }>(token.access_token, '/v2/userInfo').catch(() => null);
    const admin = getServiceClient();
    const { data: existing } = await admin.from('casso_connections').select('webhook_secret_encrypted').eq('teacher_id', user.id).maybeSingle();
    const webhookSecret = existing?.webhook_secret_encrypted ? decryptCassoSecret(existing.webhook_secret_encrypted) : crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { error } = await admin.from('casso_connections').upsert({
      teacher_id: user.id,
      access_token_encrypted: encryptCassoSecret(token.access_token),
      refresh_token_encrypted: token.refresh_token ? encryptCassoSecret(token.refresh_token) : null,
      token_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      casso_user_id: userInfo?.user?.id ? String(userInfo.user.id) : null,
      webhook_secret_encrypted: encryptCassoSecret(webhookSecret),
      status: 'connected',
      last_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id' });
    if (error) throw new Error(error.message);
    const response = NextResponse.redirect(new URL('/profile?casso=connected', origin));
    response.cookies.delete('mari_casso_state');
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Kết nối Casso thất bại.');
  }
}
