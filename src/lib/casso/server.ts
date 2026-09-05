import crypto from 'crypto';

const CASSO_OAUTH_URL = 'https://oauth.casso.vn';

type CassoTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export type CassoBankAccount = {
  id: string | number;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  connectStatus?: number;
};

function required(name: 'CASSO_CLIENT_ID' | 'CASSO_CLIENT_SECRET' | 'CASSO_TOKEN_ENCRYPTION_KEY') {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu cấu hình ${name}.`);
  return value;
}

function encryptionKey() {
  const source = required('CASSO_TOKEN_ENCRYPTION_KEY');
  const key = /^[0-9a-f]{64}$/i.test(source) ? Buffer.from(source, 'hex') : Buffer.from(source, 'base64');
  if (key.length !== 32) throw new Error('CASSO_TOKEN_ENCRYPTION_KEY phải là khóa 32 byte (base64 hoặc hex).');
  return key;
}

export function encryptCassoSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptCassoSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Dữ liệu kết nối Casso không hợp lệ.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

export function createCassoState(teacherId: string) {
  const nonce = crypto.randomBytes(20).toString('base64url');
  const payload = `${teacherId}.${Date.now()}.${nonce}`;
  const signature = crypto.createHmac('sha256', required('CASSO_CLIENT_SECRET')).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyCassoState(value: string) {
  const [teacherId, createdAt, nonce, signature] = value.split('.');
  if (!teacherId || !createdAt || !nonce || !signature || Date.now() - Number(createdAt) > 10 * 60 * 1000) return null;
  const payload = `${teacherId}.${createdAt}.${nonce}`;
  const expected = crypto.createHmac('sha256', required('CASSO_CLIENT_SECRET')).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return { teacherId };
}

export function cassoAuthorizeUrl(redirectUri: string, state: string) {
  const query = new URLSearchParams({
    client_id: required('CASSO_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'transaction webhook',
    state,
  });
  return `${CASSO_OAUTH_URL}/auth/authorize?${query.toString()}`;
}

export async function exchangeCassoCode(code: string, redirectUri: string): Promise<CassoTokenResponse> {
  const authorization = Buffer.from(`${required('CASSO_CLIENT_ID')}:${required('CASSO_CLIENT_SECRET')}`).toString('base64');
  const response = await fetch(`${CASSO_OAUTH_URL}/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${authorization}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null) as CassoTokenResponse | null;
  if (!response.ok || !body?.access_token) throw new Error('Casso không cấp được quyền truy cập. Vui lòng thử lại.');
  return body;
}

export async function cassoApi<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CASSO_OAUTH_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null) as { error?: number; message?: string; data?: T } | null;
  if (!response.ok || body?.error) throw new Error(body?.message || 'Không thể kết nối Casso.');
  return body?.data as T;
}

export function normalizeAccountNumber(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function verifyCassoWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const normalized = signature.replace(/^sha256=/i, '');
  return normalized.length === expected.length && crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
}
