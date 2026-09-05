"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Atom, BookOpen, Calculator, MailCheck, PencilLine, RefreshCw, ShieldCheck } from "lucide-react";
import { resendEmailVerification, verifySignupOtp, type AuthActionState } from "../../actions";
import { SupportButton } from "@/components/shared/SupportButton";

const initialState: AuthActionState = {};
const backgroundIcons = [
  { Icon: BookOpen, className: "left-[5%] top-[11%] size-16 -rotate-12" }, { Icon: PencilLine, className: "left-[23%] top-[7%] size-12 rotate-35" },
  { Icon: Atom, className: "right-[5%] top-[22%] size-16 rotate-12" }, { Icon: Calculator, className: "right-[8%] bottom-[17%] size-16 rotate-12" },
];

export function VerifyEmailOtpForm({ email }: { email: string }) {
  const [state, verifyAction, isPending] = useActionState(verifySignupOtp, initialState);
  const [resendState, resendAction, isResending] = useActionState(resendEmailVerification, initialState);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const token = digits.join("");

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (!secondsLeft) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);
  useEffect(() => { if (resendState.success) setSecondsLeft(60); }, [resendState.success]);

  const updateDigits = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
  };

  if (!email) return <main className="grid min-h-screen place-items-center bg-[#fffaf0] p-4"><Link className="font-semibold text-[#a95123] hover:underline" href="/register">Quay lại đăng ký</Link></main>;

  return <main className="mari-animated-background relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)] px-4 py-8 font-sans">
    <div className="pointer-events-none absolute inset-0 opacity-20 text-[#d97932]" aria-hidden="true">{backgroundIcons.map(({ Icon, className }, index) => <Icon key={index} className={`absolute stroke-[1.5] ${className}`} />)}</div>
    <section className="relative z-10 w-full max-w-[450px] rounded-[24px] border border-white/90 bg-white/95 px-6 pb-7 pt-6 text-center shadow-[0_18px_45px_rgba(137,77,33,0.24)] backdrop-blur sm:px-8">
      <div className="mx-auto mb-3 relative h-12 w-32 overflow-hidden"><Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="128px" className="object-contain mix-blend-multiply" priority /></div>
      <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-orange-100 text-[#e86f18]"><MailCheck className="size-5" /></div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#a95123]">Xác thực email</h1>
      <p className="mt-2 text-xs leading-5 text-zinc-500">Nhập mã 6 chữ số Mari đã gửi tới<br /><strong className="font-semibold text-zinc-700">{email}</strong></p>
      <form action={verifyAction} className="mt-5 space-y-4"><input type="hidden" name="email" value={email} /><input type="hidden" name="token" value={token} />
        <div className="flex justify-center gap-2" aria-label="Mã xác thực gồm 6 chữ số">{digits.map((digit, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} value={digit} onChange={(event) => updateDigits(event.target.value, index)} onPaste={handlePaste} onKeyDown={(event) => handleKeyDown(event, index)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} className="size-10 rounded-xl border border-[#e9c999] bg-[#fffaf2] text-center text-lg font-bold text-zinc-800 outline-none transition focus:border-[#ed8d35] focus:ring-3 focus:ring-[#f7bd76]/35 sm:size-11" />)}</div>
        {state?.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>}
        <button type="submit" disabled={isPending || token.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] text-sm font-bold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_3px_0_#d95508] disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="size-4" />{isPending ? "Đang xác thực..." : "Xác thực tài khoản"}</button>
      </form>
      <form action={resendAction} className="mt-5 border-t border-orange-100 pt-4"><input type="hidden" name="email" value={email} /><p className="mb-2 text-[11px] text-zinc-500">Mã có hiệu lực trong 10 phút. Kiểm tra cả thư mục Spam.</p><button type="submit" disabled={isResending || secondsLeft > 0} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a95123] hover:text-[#ef7616] disabled:cursor-not-allowed disabled:text-zinc-400"><RefreshCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />{secondsLeft > 0 ? `Gửi lại sau ${secondsLeft}s` : isResending ? "Đang gửi..." : "Gửi lại mã"}</button>{resendState.error && <p role="alert" className="mt-2 text-xs text-red-600">{resendState.error}</p>}{resendState.success && <p className="mt-2 text-xs text-emerald-700">Mã mới đã được gửi.</p>}</form>
      <Link href="/register" className="mt-4 inline-block text-xs font-medium text-zinc-600 hover:text-[#a95123] hover:underline">Dùng email khác</Link>
    </section>
    <SupportButton variant="floating" />
  </main>;
}
