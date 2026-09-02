import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
  }

  // Determine redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://giasupro.taidt.id.vn/api/auth/google/callback'
    : 'http://localhost:3000/api/auth/google/callback';

  // We request 'offline' access to get a refresh token
  // prompt=consent ensures we always get a refresh token when they link
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent'
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
