'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
import { resendPasswordResetOtp, verifyRecoveryOtpAndUpdatePassword, type AuthActionState } from '../actions';

const initialState: AuthActionState = {};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [state, formAction, isPending] = useActionState(verifyRecoveryOtpAndUpdatePassword, initialState);
  const [resendState, resendAction, isResending] = useActionState(resendPasswordResetOtp, initialState);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const token = digits.join('');

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => { if (!secondsLeft) return; const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000); return () => window.clearInterval(timer); }, [secondsLeft]);
  useEffect(() => { if (resendState.success) setSecondsLeft(60); }, [resendState.success]);

  const updateDigit = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };
  const paste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const value = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!value) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => value[index] ?? ''));
    refs.current[Math.min(value.length, 5)]?.focus();
  };

  if (!email) return <main className="grid min-h-screen place-items-center bg-[#fffaf0] p-4"><Link className="font-semibold text-[#a95123] hover:underline" href="/forgot-password">Yêu cầu mã đặt lại mật khẩu</Link></main>;

  return <main className="mari-animated-background relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)] px-4 py-8 font-sans">
    <section className="relative z-10 w-full max-w-[430px] rounded-[24px] border border-white/90 bg-white/95 px-6 pb-7 pt-6 shadow-[0_18px_45px_rgba(137,77,33,0.24)] backdrop-blur sm:px-8">
      <div className="mx-auto mb-3 relative h-12 w-32 overflow-hidden"><Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="128px" className="object-contain mix-blend-multiply" priority /></div>
      <div className="text-center"><h1 className="text-2xl font-extrabold tracking-tight text-[#a95123]">Đặt lại mật khẩu</h1><p className="mt-2 text-xs leading-5 text-zinc-500">Nhập mã 6 chữ số đã gửi tới<br /><strong className="font-semibold text-zinc-700">{email}</strong></p></div>
      <form action={formAction} className="mt-5 space-y-3"><input type="hidden" name="email" value={email} /><input type="hidden" name="token" value={token} />
        <div className="flex justify-center gap-2" aria-label="Mã xác thực gồm 6 chữ số">{digits.map((digit, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} value={digit} onChange={(event) => updateDigit(event.target.value, index)} onPaste={paste} onKeyDown={(event) => { if (event.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus(); }} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} className="size-10 rounded-xl border border-[#e9c999] bg-[#fffaf2] text-center text-lg font-bold text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35 sm:size-11" />)}</div>
        {state?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>}
        <PasswordField id="password" name="password" label="Mật khẩu mới" visible={showPassword} setVisible={setShowPassword} />
        <PasswordField id="confirmPassword" name="confirmPassword" label="Xác nhận mật khẩu mới" visible={showConfirmation} setVisible={setShowConfirmation} />
        <button type="submit" disabled={isPending || token.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="size-4" />{isPending ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}</button>
      </form>
      <form action={resendAction} className="mt-5 border-t border-orange-100 pt-4 text-center"><input type="hidden" name="email" value={email} /><p className="mb-2 text-[11px] text-zinc-500">Mã có hiệu lực trong 10 phút. Kiểm tra cả mục Spam.</p><button type="submit" disabled={isResending || secondsLeft > 0} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a95123] disabled:text-zinc-400"><RefreshCw className={`size-3.5 ${isResending ? 'animate-spin' : ''}`} />{secondsLeft > 0 ? `Gửi lại sau ${secondsLeft}s` : 'Gửi lại mã'}</button>{resendState.success && <p className="mt-2 text-xs text-emerald-700">Đã gửi mã mới.</p>}{resendState.error && <p className="mt-2 text-xs text-red-600">{resendState.error}</p>}</form>
      <Link href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#a95123] hover:underline"><ArrowLeft className="size-3.5" />Quay lại đăng nhập</Link>
    </section>
  </main>;
}

function PasswordField({ id, name, label, visible, setVisible }: { id: string; name: string; label: string; visible: boolean; setVisible: (value: boolean) => void }) {
  return <label className="block text-xs font-semibold text-zinc-600" htmlFor={id}>{label}<span className="relative mt-1.5 block"><input id={id} name={name} type={visible ? 'text' : 'password'} minLength={8} required autoComplete="new-password" className="h-10 w-full rounded-xl border border-[#e9c999] bg-[#fffaf2] px-3 pr-10 text-sm text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35" /><button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a65b32]">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>;
}
