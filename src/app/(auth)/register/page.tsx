'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';
import { register } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, PawPrint } from 'lucide-react';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';

const initialState = { error: '' };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register as any, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="mari-animated-background flex min-h-screen flex-col bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)]">
      <OnboardingHeader className="bg-transparent" />
      <main className="relative flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-transparent px-4 py-8">
        <div className="pointer-events-none absolute inset-0 text-[#eea76a] opacity-20" aria-hidden="true">
          <PawPrint className="absolute left-[7%] top-[13%] size-9 -rotate-[28deg]" />
          <PawPrint className="absolute left-[15%] top-[27%] size-6 -rotate-[12deg]" />
          <PawPrint className="absolute left-[5%] bottom-[18%] size-11 rotate-[20deg]" />
          <PawPrint className="absolute right-[16%] top-[14%] size-8 rotate-[18deg]" />
          <PawPrint className="absolute right-[8%] top-[34%] size-6 rotate-[32deg]" />
          <PawPrint className="absolute right-[31%] bottom-[12%] size-8 -rotate-[18deg]" />
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-14 h-72 w-72 rounded-full bg-[#ffe7a5]/55 blur-3xl" aria-hidden="true" />

        <form action={formAction} className="relative z-10 w-full max-w-md">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="space-y-1 text-center sr-only">
              <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
                Tạo tài khoản
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Điền thông tin bên dưới để đăng ký tài khoản mới
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {state?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {state.error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required 
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" disabled={isPending} className="relative w-full bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50">
                {isPending ? 'Đang xử lý...' : 'Đăng ký'}
                {!isPending && <PawPrint className="absolute right-4 size-5 text-[#f4b071]" aria-hidden="true" />}
              </Button>
              <div className="text-center text-sm text-zinc-500">
                Đã có tài khoản?{' '}
                <Link href="/login" className="inline-flex items-center gap-1 font-medium text-zinc-900 hover:underline">Đăng nhập <PawPrint className="size-4 text-[#9a5d32]" aria-hidden="true" /></Link>
              </div>
            </CardFooter>
          </Card>
        </form>
        <Image
          src="/images/empty_states/cat_sitdown.png"
          alt="Mascot Mari ngồi"
          width={300}
          height={380}
          priority
          className="pointer-events-none absolute bottom-0 right-3 z-0 hidden h-auto w-40 drop-shadow-[0_10px_8px_rgba(141,83,30,0.22)] md:block lg:right-10 lg:w-48 xl:right-[7%] xl:w-56"
        />
      </main>
    </div>
  );
}
