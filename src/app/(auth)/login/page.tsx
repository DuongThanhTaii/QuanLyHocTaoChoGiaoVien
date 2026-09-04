'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { Atom, BookOpen, Calculator, Eye, EyeOff, PencilLine, Sparkles } from 'lucide-react';
import { login, type AuthActionState } from '../actions';
import { SupportButton } from '@/components/shared/SupportButton';
import { GoogleSignInButton } from './GoogleSignInButton';

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

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordWasReset, setPasswordWasReset] = useState(false);

  useEffect(() => {
    setPasswordWasReset(new URLSearchParams(window.location.search).get('reset') === 'success');
  }, []);

  return (
    <main className="mari-animated-background relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)] px-4 py-8 font-sans">
      <div className="pointer-events-none absolute inset-0 opacity-20 text-[#d97932]">
        {backgroundIcons.map(({ Icon, className }, index) => <Icon key={index} className={`absolute stroke-[1.5] ${className}`} />)}
      </div>
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-orange-300/25 blur-3xl" />

      <section className="relative z-10 w-full max-w-[690px]">
        <div className="relative mx-auto w-full max-w-[410px] rounded-[24px] border border-white/90 bg-white/95 px-6 pb-7 pt-6 shadow-[0_18px_45px_rgba(137,77,33,0.24)] backdrop-blur sm:max-w-[450px] sm:px-8">
          <div className="mb-3 flex justify-center">
            <div className="relative h-12 w-32 overflow-hidden">
              <Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="128px" className="object-contain mix-blend-multiply" priority />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#a95123]">Đăng nhập</h1>
            <p className="mt-1 text-xs text-zinc-500">Nhập email và mật khẩu để truy cập tài khoản của bạn</p>
          </div>

          <form action={formAction} className="mt-5 space-y-3">
            {passwordWasReset && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Mật khẩu đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.</div>
            )}
            {state?.error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>
            )}
            <label className="block text-xs font-semibold text-zinc-600" htmlFor="email">
              Email
              <input id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tenban@email.com" required autoComplete="email" className="mt-1.5 h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
            </label>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-600" htmlFor="password">Mật khẩu</label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#a95123] transition hover:text-[#ef7616] hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative mt-1.5">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32] transition hover:text-[#ef7616]" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60">
              <Sparkles className="size-4" /> {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />hoặc<span className="h-px flex-1 bg-zinc-200" /></div>
          <GoogleSignInButton />

          <p className="mt-5 text-center text-xs text-zinc-600">Chưa có tài khoản? <Link href="/register" className="font-bold text-[#a95123] hover:text-[#ef7616] hover:underline">Đăng ký ngay</Link></p>
        </div>

        <Image src="/images/empty_states/cat_stand.png" alt="Mascot Mari" width={280} height={390} priority className="pointer-events-none absolute -bottom-5 -left-12 hidden h-auto w-52 drop-shadow-[0_12px_8px_rgba(133,69,17,0.25)] lg:block" />
      </section>
      <SupportButton variant="floating" />
    </main>
  );
}
