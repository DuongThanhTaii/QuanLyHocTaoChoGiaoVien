'use client';

import { useActionState, useState } from 'react';
import { register } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { OnboardingHeader } from '@/components/layout/OnboardingHeader';

const initialState = { error: '' };

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register as any, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <OnboardingHeader />
      <main className="flex-1 flex items-start justify-center px-4 py-8 relative min-h-0">
        <form action={formAction} className="w-full max-w-md">
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
              <Button type="submit" disabled={isPending} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50">
                {isPending ? 'Đang xử lý...' : 'Đăng ký'}
              </Button>
              <div className="text-center text-sm text-zinc-500">
                Đã có tài khoản?{' '}
                <Link href="/login" className="font-medium text-zinc-900 hover:underline">
                  Đăng nhập
                </Link>
              </div>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
