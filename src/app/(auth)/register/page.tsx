'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Atom, BookOpen, Calculator, Eye, EyeOff, PencilLine, Sparkles } from 'lucide-react';
import { register, type AuthActionState } from '../actions';
import { SupportButton } from '@/components/shared/SupportButton';
import { GoogleSignInButton } from '../login/GoogleSignInButton';

const initialState: AuthActionState = {};

const backgroundIcons = [
  { Icon: BookOpen, className: 'left-[5%] top-[11%] size-16 -rotate-12' },
  { Icon: PencilLine, className: 'left-[23%] top-[7%] size-12 rotate-35' },
  { Icon: Atom, className: 'left-[38%] top-[8%] size-14 rotate-12' },
  { Icon: BookOpen, className: 'right-[5%] top-[22%] size-16 rotate-12' },
  { Icon: PencilLine, className: 'right-[20%] top-[8%] size-12 rotate-35' },
  { Icon: Calculator, className: 'right-[8%] bottom-[17%] size-16 rotate-12' },
  { Icon: BookOpen, className: 'left-[8%] bottom-[15%] size-18 -rotate-12' },
  { Icon: Atom, className: 'right-[25%] bottom-[7%] size-14 -rotate-12' },
];

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="mari-animated-background relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)] px-4 py-8 font-sans">
      <div className="pointer-events-none absolute inset-0 opacity-20 text-[#d97932]" aria-hidden="true">
        {backgroundIcons.map(({ Icon, className }, index) => <Icon key={index} className={`absolute stroke-[1.5] ${className}`} />)}
      </div>
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-orange-300/25 blur-3xl" aria-hidden="true" />

      <section className="relative z-10 w-full max-w-[690px]">
        <div className="relative mx-auto w-full max-w-[410px] rounded-[24px] border border-white/90 bg-white/95 px-6 pb-7 pt-6 shadow-[0_18px_45px_rgba(137,77,33,0.24)] backdrop-blur sm:max-w-[450px] sm:px-8">
          <div className="mb-3 flex justify-center">
            <div className="relative h-12 w-32 overflow-hidden">
              <Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="128px" className="object-contain mix-blend-multiply" priority />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#a95123]">Tạo tài khoản</h1>
            <p className="mt-1 text-xs text-zinc-500">Bắt đầu quản lý lớp học cùng Mari</p>
          </div>

          <form action={formAction} className="mt-5 space-y-3">
            {state?.error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>
            )}
            <label className="block text-xs font-semibold text-zinc-600" htmlFor="email">
              Email
              <input id="email" name="email" type="email" placeholder="tenban@email.com" required autoComplete="email" className="mt-1.5 h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
            </label>
            <div>
              <label className="text-xs font-semibold text-zinc-600" htmlFor="password">Mật khẩu</label>
              <div className="relative mt-1.5">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32] transition hover:text-[#ef7616]" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="relative mt-1.5">
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32] transition hover:text-[#ef7616]" aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">Tối thiểu 6 ký tự.</p>
            </div>
            <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60">
              <Sparkles className="size-4" /> {isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />hoặc<span className="h-px flex-1 bg-zinc-200" /></div>
          <GoogleSignInButton />

          <p className="mt-5 text-center text-xs text-zinc-600">Đã có tài khoản? <Link href="/login" className="font-bold text-[#a95123] hover:text-[#ef7616] hover:underline">Đăng nhập</Link></p>
          <p className="mt-3 text-center text-[11px] leading-5 text-zinc-500">
            Bằng việc đăng ký, bạn đồng ý với <Link href="/terms" className="font-medium text-[#a95123] hover:underline">Điều khoản sử dụng</Link> và <Link href="/privacy" className="font-medium text-[#a95123] hover:underline">Chính sách bảo mật</Link> của Mari.
          </p>
        </div>

        <Image src="/images/empty_states/cat_stand.png" alt="Mascot Mari" width={280} height={390} priority className="pointer-events-none absolute -bottom-5 -left-12 hidden h-auto w-52 drop-shadow-[0_12px_8px_rgba(133,69,17,0.25)] lg:block" />
      </section>
      <SupportButton variant="floating" />
    </main>
  );
}
