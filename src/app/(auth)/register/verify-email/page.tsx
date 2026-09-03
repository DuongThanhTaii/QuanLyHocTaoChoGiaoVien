import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { VerifyEmailResend } from './VerifyEmailResend';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <OnboardingHeader />
      <main className="flex-1 flex items-start justify-center px-4 py-8 relative min-h-0">
        <Card className="w-full max-w-md border-zinc-200 shadow-sm text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-zinc-900" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
              Kiểm tra email của bạn
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Chúng tôi đã gửi link xác thực đến email
              {email && <span className="block font-medium text-zinc-900 mt-1">{email}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">
              Vui lòng mở email và nhấn &quot;Xác thực email&quot; để tiếp tục.
              Link có hiệu lực trong vòng 24 giờ.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Link href="/login" className="inline-flex h-9 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
              Về trang đăng nhập
            </Link>
            <VerifyEmailResend email={email} />
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
