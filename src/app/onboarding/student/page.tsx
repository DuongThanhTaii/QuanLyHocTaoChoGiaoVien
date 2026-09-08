'use client';

import { useActionState } from 'react';
import { completeStudentOnboarding } from '../actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const initialState = { error: '' };

export default function StudentOnboardingPage() {
  const [state, formAction, isPending] = useActionState(completeStudentOnboarding, initialState);

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 pb-8 pt-4">
      <Image src="/images/empty_states/cat_stand.png" alt="" width={280} height={390} priority className="pointer-events-none absolute right-12 top-0 hidden h-auto w-52 drop-shadow-[0_12px_8px_rgba(133,69,17,0.25)] xl:block" />
      <form action={formAction} className="relative z-10 w-full max-w-md">
        <Card className="border-white/90 bg-white/95 shadow-[0_18px_45px_rgba(137,77,33,0.24)]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-extrabold tracking-tight text-[#a95123]">
              Thông tin Học sinh
            </CardTitle>
            <CardDescription className="text-[#9f745f]">
              Hoàn thiện thông tin để tham gia lớp học
            </CardDescription>
          </CardHeader>
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
                placeholder="Nguyễn Minh Anh" 
                required 
                className="border-[#e9c999] bg-[#fffaf2]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="09..." 
                className="border-[#e9c999] bg-[#fffaf2]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">Trường đang học</Label>
              <Input 
                id="school" 
                name="school" 
                placeholder="THPT..." 
                className="border-[#e9c999] bg-[#fffaf2]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60">
              {isPending ? 'Đang lưu...' : 'Hoàn tất'}
            </button>
            <div className="text-center text-sm text-[#9f745f]">
              <Link href="/onboarding" className="text-[#a95123] hover:underline">
                Quay lại chọn vai trò khác
              </Link>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
