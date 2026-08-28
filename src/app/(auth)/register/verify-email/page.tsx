import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';

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
              Vui lòng mở email và nhấn "Xác thực email" để tiếp tục. 
              Link có hiệu lực trong vòng 24 giờ.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <div className="text-sm text-zinc-500 mt-4">
              Không nhận được email? <span className="font-medium cursor-pointer hover:underline text-zinc-900">Gửi lại (TODO)</span>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
