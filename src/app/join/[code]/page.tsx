import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinClassForm } from './JoinClassForm';
import { redirect } from 'next/navigation';

export default async function JoinClassPage({ params, searchParams }: { params: Promise<{ code: string }>, searchParams?: Promise<{ claim?: string }> }) {
  const { code } = await params;
  const sp = searchParams ? await searchParams : {};
  const claim = sp.claim;
  const returnTo = `/join/${encodeURIComponent(code)}${claim ? `?claim=${encodeURIComponent(claim)}` : ''}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && !user.email_confirmed_at) {
    redirect(`/register/verify-email?email=${encodeURIComponent(user.email || '')}&next=${encodeURIComponent(returnTo)}`);
  }
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle();
    if (profile?.status !== 'ACTIVE') redirect(`/onboarding?next=${encodeURIComponent(returnTo)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Tham gia lớp học</CardTitle>
          <CardDescription>Bạn được mời tham gia lớp với mã <strong>{code.toUpperCase()}</strong>.</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? <JoinClassForm code={code} claim={claim} /> : <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white">Đăng nhập hoặc đăng ký để tham gia</Link>}
        </CardContent>
      </Card>
    </main>
  );
}
