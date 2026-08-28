import { headers } from 'next/headers';

export async function getAppUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';

  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
