'use client';

import { useActionState } from 'react';
import { completeGuardianOnboarding } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

const initialState = { error: '' };

export default function GuardianOnboardingPage() {
  const [state, formAction, isPending] = useActionState(completeGuardianOnboarding as any, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md border-zinc-200 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900">
            Thông tin Phụ huynh
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Hoàn thiện thông tin để theo dõi con em
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input 
                id="fullName" 
                name="fullName" 
                placeholder="Nguyễn Văn B" 
                required 
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="09..." 
                required
                className="bg-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" disabled={isPending} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
              {isPending ? 'Đang lưu...' : 'Hoàn tất'}
            </Button>
            <div className="text-center text-sm text-zinc-500">
              <Link href="/onboarding" className="hover:underline">
                Quay lại chọn vai trò khác
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
