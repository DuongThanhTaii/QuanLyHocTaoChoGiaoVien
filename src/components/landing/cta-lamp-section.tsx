"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import { LoggedInUser } from "./navbar";

interface CTALampSectionProps {
  user?: LoggedInUser | null;
}

export const CTALampSection = ({ user }: CTALampSectionProps) => {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-white via-orange-50/50 to-white dark:from-zinc-950 dark:via-orange-950/20 dark:to-zinc-950 border-t border-orange-100/80 dark:border-zinc-800 overflow-hidden select-none">
      {/* Background Subtle Orange Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[300px] sm:h-[400px] bg-gradient-to-tr from-orange-400/15 via-amber-300/15 to-transparent blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Tech Grid Texture matching other sections */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none -z-10" />

      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Khởi đầu thảnh thơi" />
          </AnimationContainer>

          {/* Headline */}
          <AnimationContainer delay={0.1}>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Sẵn sàng chuyển đổi số <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500">
                cho lớp học của bạn?
              </span>
            </h2>
          </AnimationContainer>

          {/* Subtitle */}
          <AnimationContainer delay={0.15}>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-xl text-balance leading-relaxed">
              Trải nghiệm nền tảng quản lý học tập toàn diện nhất cho Giáo viên & Gia sư. Miễn phí sử dụng, thiết lập trong 30 giây.
            </p>
          </AnimationContainer>

          {/* CTA Buttons */}
          <AnimationContainer delay={0.2} className="pt-2 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                href={user.dashboardUrl}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Vào trang làm việc Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Đăng ký giáo viên miễn phí</span>
                <Zap className="w-5 h-5 fill-current" />
              </Link>
            )}

            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-base hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <span>Xem lại tính năng</span>
            </Link>
          </AnimationContainer>

          {/* Trust Guarantees */}
          <AnimationContainer delay={0.25} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 pt-2">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Miễn phí trọn đời gói Cơ bản
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Không cần thẻ tín dụng
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Hỗ trợ kỹ thuật 24/7
            </span>
          </AnimationContainer>
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default CTALampSection;
