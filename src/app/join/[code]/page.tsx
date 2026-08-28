import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinClassForm } from './JoinClassForm';

export default async function JoinClassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Tham gia lớp học</CardTitle>
          <CardDescription>Bạn được mời tham gia lớp với mã <strong>{code.toUpperCase()}</strong>.</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? <JoinClassForm code={code} /> : <Link href="/login" className="block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white">Đăng nhập để tham gia</Link>}
        </CardContent>
      </Card>
    </main>
  );
}
