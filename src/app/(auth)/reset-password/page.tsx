'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { updatePassword, type AuthActionState } from '../actions';

const initialState: AuthActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <main className="mari-animated-background relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)] px-4 py-8 font-sans">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-orange-300/25 blur-3xl" />

      <section className="relative z-10 w-full max-w-[410px] rounded-[24px] border border-white/90 bg-white/95 px-6 pb-7 pt-6 shadow-[0_18px_45px_rgba(137,77,33,0.24)] backdrop-blur sm:px-8">
        <div className="mb-5 flex justify-center">
          <div className="relative h-12 w-32 overflow-hidden">
            <Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="128px" className="object-contain mix-blend-multiply" priority />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#a95123]">Tạo mật khẩu mới</h1>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Chọn mật khẩu mới có tối thiểu 8 ký tự để bảo vệ tài khoản Mari của bạn.</p>
        </div>

        <form action={formAction} className="mt-5 space-y-3">
          {state?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>}
          <label className="block text-xs font-semibold text-zinc-600" htmlFor="password">
            Mật khẩu mới
            <span className="relative mt-1.5 block">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} minLength={8} required autoComplete="new-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32] transition hover:text-[#ef7616]" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </span>
          </label>
          <label className="block text-xs font-semibold text-zinc-600" htmlFor="confirmPassword">
            Xác nhận mật khẩu mới
            <span className="relative mt-1.5 block">
              <input id="confirmPassword" name="confirmPassword" type={showConfirmation ? 'text' : 'password'} minLength={8} required autoComplete="new-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" />
              <button type="button" onClick={() => setShowConfirmation((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32] transition hover:text-[#ef7616]" aria-label={showConfirmation ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </span>
          </label>
          <button type="submit" disabled={isPending} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60">
            <Sparkles className="size-4" /> {isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>

        <Link href="/login" className="mt-5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#a95123] transition hover:text-[#ef7616] hover:underline"><ArrowLeft className="size-3.5" />Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}
