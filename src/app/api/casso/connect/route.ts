import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { cassoAuthorizeUrl, createCassoState } from '@/lib/casso/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));

  try {
    const state = createCassoState(user.id);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const redirectUri = `${origin}/api/casso/callback`;
    const response = NextResponse.redirect(cassoAuthorizeUrl(redirectUri, state));
    response.cookies.set('mari_casso_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/casso', maxAge: 600 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể khởi tạo kết nối Casso.';
    return NextResponse.redirect(new URL(`/profile?casso_error=${encodeURIComponent(message)}`, request.url));
  }
}
