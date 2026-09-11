import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

function key() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.CASSO_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('Thiếu GOOGLE_TOKEN_ENCRYPTION_KEY.');
  const value = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (value.length !== 32) throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY phải là khóa 32 byte.');
  return value;
}
export function encryptGoogleToken(value: string) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`; }
export function decryptGoogleToken(value: string) { const [iv, tag, payload] = value.split('.'); if (!iv || !tag || !payload) throw new Error('Token Drive không hợp lệ.'); const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url')); decipher.setAuthTag(Buffer.from(tag, 'base64url')); return Buffer.concat([decipher.update(Buffer.from(payload, 'base64url')), decipher.final()]).toString('utf8'); }

export async function getGoogleAccessToken(admin: SupabaseClient, userId: string) {
  const { data: profile, error } = await admin.from('profiles').select('google_refresh_token, google_refresh_token_encrypted').eq('id', userId).single();
  if (error) throw new Error(error.message);
  const refreshToken = profile?.google_refresh_token_encrypted ? decryptGoogleToken(profile.google_refresh_token_encrypted) : profile?.google_refresh_token;
  if (!refreshToken) throw new Error('Drive chưa được kết nối.');
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: refreshToken, grant_type: 'refresh_token' }) });
  const body = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error === 'invalid_grant' ? 'Kết nối Drive đã hết hiệu lực. Vui lòng kết nối lại.' : 'Không thể xác thực Google Drive.');
  return body.access_token;
}
