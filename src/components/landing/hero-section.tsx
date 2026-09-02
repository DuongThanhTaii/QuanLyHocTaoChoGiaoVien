"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { AnimationContainer } from "@/components/global/animation-container";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { DashboardMockup } from "./dashboard-mockup";
import { CatMascot } from "./cat-mascot";
import { LoggedInUser } from "./navbar";

interface HeroSectionProps {
  user?: LoggedInUser | null;
}

export const HeroSection = ({ user }: HeroSectionProps) => {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden select-none">
      {/* Background Texture with Radial Mask like Linkify */}
      <div
        id="home"
        className="absolute inset-0 dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] h-[1100px] pointer-events-none -z-10"
      />

      <MaxWidthWrapper className="relative">
        {/* Main Hero Header */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          {/* Linkify Signature Spark Flip Badge */}
          <AnimationContainer delay={0.05}>
            <button className="group relative grid overflow-hidden rounded-full px-4 py-1.5 shadow-[0_1000px_0_0_hsl(0_0%_100%)_inset] dark:shadow-[0_1000px_0_0_hsl(0_0%_15%)_inset] transition-colors duration-200 border border-orange-200/80 dark:border-orange-900/60 mb-6 cursor-pointer">
              <span>
                <span className="spark mask-gradient absolute inset-0 h-full w-full animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,#f97316_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
              </span>
              <span className="backdrop absolute inset-[1px] rounded-full bg-white dark:bg-zinc-900 transition-colors duration-200 group-hover:bg-orange-50/60 dark:group-hover:bg-zinc-800" />
              <span className="h-full w-full blur-md absolute bottom-0 inset-x-0 bg-gradient-to-tr from-orange-500/20"></span>
              <span className="z-10 py-0.5 text-xs sm:text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center justify-center gap-1.5">
                ✨ Nền tảng Quản lý Lớp học & Học phí 4.0
                <ArrowRight className="ml-1 size-3.5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
              </span>
            </button>
          </AnimationContainer>

          {/* Heading */}
          <AnimationContainer delay={0.1}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.12]">
              Dạy Học Thông Minh. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500">
                Quản Lý Thảnh Thơi.
              </span>
            </h1>
          </AnimationContainer>

          {/* Subtitle */}
          <AnimationContainer delay={0.15}>
            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-zinc-300 max-w-2xl leading-relaxed text-balance">
              Giải pháp All-in-one cho Giáo viên & Gia sư: Tự động hóa điểm danh QR, nhắc lịch dạy, kết nối phụ huynh và thu học phí tự động qua VietQR.
            </p>
          </AnimationContainer>

          {/* CTAs */}
          <AnimationContainer delay={0.2} className="mt-8 flex flex-wrap items-center justify-center gap-4 z-20">
            {user ? (
              <Link
                href={user.dashboardUrl}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                <span>Tiếp tục vào Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                <span>Bắt đầu miễn phí 14 ngày</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <span>Xem tính năng nổi bật</span>
            </Link>
          </AnimationContainer>

          {/* Trust points */}
          <AnimationContainer delay={0.25} className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Không cần thẻ tín dụng
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Khởi tạo lớp trong 30 giây
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Hỗ trợ nhập dữ liệu từ Excel
            </span>
          </AnimationContainer>
        </div>

        {/* Dashboard Showcase Mockup with Glow & Cat Mascot */}
        <div className="relative mt-12 sm:mt-16 lg:mt-20">
          {/* Animated Glow Backdrop from Linkify */}
          <div className="absolute md:top-[10%] left-1/2 w-3/4 -translate-x-1/2 h-1/4 md:h-1/3 inset-0 blur-[5rem] bg-gradient-to-tr from-orange-500/30 to-amber-400/30 animate-image-glow -z-10" />

          {/* Interactive Mascot Placement */}
          <div className="absolute -top-16 sm:-top-24 right-4 sm:right-10 lg:right-16 z-20">
            <CatMascot
              variant="stand"
              size="md"
              speechText="Thầy/Cô chỉ việc dạy hay, sổ sách cứ để em lo! 🐾"
              alwaysShowSpeech={false}
              showSpeechOnHover={true}
            />
          </div>

          <AnimationContainer delay={0.3}>
            <DashboardMockup />
          </AnimationContainer>
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default HeroSection;
