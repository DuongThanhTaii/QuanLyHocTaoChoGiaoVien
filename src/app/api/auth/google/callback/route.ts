import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/teacher/content?error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/teacher/content?error=no_code`, req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing Google credentials in env' }, { status: 500 });
  }

  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://giasupro.taidt.id.vn/api/auth/google/callback'
    : 'http://localhost:3000/api/auth/google/callback';

  try {
    // 1. Exchange authorization code for refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Failed to get token:', tokens);
      return NextResponse.redirect(new URL(`/teacher/content?error=token_exchange_failed`, req.url));
    }

    const { refresh_token, access_token } = tokens;

    // We MUST have a refresh token (if user already granted it before and prompt wasn't consent, it might be null, but we forced prompt=consent)
    if (!refresh_token) {
      // Sometimes Google only returns access_token if we already have a refresh token.
      // We should ideally force it, which we did. But if it fails:
      console.warn('No refresh token received. We might already have it.');
    }

    // 2. Save refresh token to Supabase profiles
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(`/login`, req.url));
    }

    // We need to add google_refresh_token to profiles if it doesn't exist yet, 
    // but we can just use supabase to update. 
    // We should create a migration for this column.
    if (refresh_token) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ google_refresh_token: refresh_token })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Failed to update profile:', updateError);
        return NextResponse.redirect(new URL(`/teacher/content?error=db_update_failed`, req.url));
      }
    }

    // Redirect back to teacher content page with success
    return NextResponse.redirect(new URL(`/teacher/content?success=drive_linked`, req.url));
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(new URL(`/teacher/content?error=server_error`, req.url));
  }
}
