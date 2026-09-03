"use client";

import React from "react";
import { PROCESS_STEPS } from "@/config/landing-data";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import { MagicCard } from "@/components/ui/magic-card";
import { CatMascot } from "./cat-mascot";
import { Clock } from "lucide-react";

export const ProcessSection = () => {
  return (
    <section
      id="process"
      className="py-20 sm:py-28 bg-gradient-to-b from-white via-orange-50/30 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border-t border-orange-100/60 dark:border-zinc-800 relative select-none"
    >
      <MaxWidthWrapper>
        {/* Section Title */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-16">
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Quy trình tinh gọn" />
          </AnimationContainer>

          <AnimationContainer delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Bắt đầu dễ dàng trong <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                3 bước nhanh gọn
              </span>
            </h2>
          </AnimationContainer>

          <AnimationContainer delay={0.15}>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              Không cần mất hàng tuần để làm quen. Bạn có thể sẵn sàng giảng dạy
              <br />
              và quản lý lớp học ngay hôm nay.
            </p>
          </AnimationContainer>
        </div>

        {/* 3 Step Magic Cards matching Linkify Process Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PROCESS_STEPS.map((step, idx) => (
            <AnimationContainer key={step.step} delay={0.1 + idx * 0.12}>
              <MagicCard className="h-full flex flex-col justify-between p-6 sm:p-8 relative">
                <div>
                  {/* Số thứ tự bước đặt ở bên trái */}
                  <div className="flex items-center mb-6">
                    <span className="border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-950/30 font-bold text-xl rounded-full w-12 h-12 flex items-center justify-center shadow-xs">
                      {idx + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Cat Mascot Speech Bubble for Step */}
                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  {idx === 0 ? (
                    <div className="group/cat relative flex items-center gap-3 cursor-pointer">
                      <CatMascot
                        variant="sitdown"
                        size="sm"
                        showSpeechOnHover={false}
                        float={true}
                      />
                      {/* Bong bóng chỉ xuất hiện khi hover vào bé mèo */}
                      <div className="opacity-0 group-hover/cat:opacity-100 -translate-x-2 group-hover/cat:translate-x-0 transition-all duration-300 relative px-3.5 py-2.5 rounded-2xl bg-orange-50 dark:bg-zinc-800/90 border border-orange-200 dark:border-orange-800/60 shadow-md pointer-events-none">
                        <p className="text-xs font-semibold text-orange-900 dark:text-orange-300">
                          "{step.catDialogue}"
                        </p>
                        {/* Đuôi bong bóng trỏ thẳng vào bé mèo */}
                        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px] border-r-orange-200 dark:border-r-orange-800" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 italic">
                      "{step.catDialogue}"
                    </p>
                  )}
                </div>
              </MagicCard>
            </AnimationContainer>
          ))}
        </div>

        {/* Mascot Highlight Banner: Cat sleeping peacefully */}
        <AnimationContainer delay={0.4} className="mt-16">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 dark:border-orange-500/20 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center lg:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Tiết kiệm 5+ giờ mỗi tuần</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Thầy cô thảnh thơi tận hưởng buổi tối trọn vẹn
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300">
                Không còn cảnh thức khuya rà soát từng giao dịch ngân hàng,
                không còn sợ sót điểm danh hay thất lạc sổ sách. Mọi công việc
                quản lý hành chính đã được Mari tự động hóa chu toàn.
              </p>
            </div>

            {/* Sleeping Cat Mascot with Horizontal Hover Bubble (Không bị chìm/cắt mép trên) */}
            <div className="shrink-0 group/sleep relative flex flex-col sm:flex-row items-center justify-center gap-3 cursor-pointer">
              {/* Bong bóng xuất hiện khi hover, nằm ngang hướng vào mèo nên không chạm mép khung */}
              <div className="opacity-0 group-hover/sleep:opacity-100 translate-x-2 group-hover/sleep:translate-x-0 transition-all duration-300 relative px-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800/60 shadow-lg text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 pointer-events-none whitespace-pre-line text-center sm:text-left">
                Sổ sách cứ để em, thầy cô nghỉ ngơi nha! ☕
                {/* Đuôi bong bóng hướng vào bé mèo ngủ */}
                <div className="hidden sm:block absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-white dark:border-l-zinc-800" />
                <div className="sm:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-white dark:border-t-zinc-800" />
              </div>

              <CatMascot
                variant="sleep"
                size="lg"
                showSpeechOnHover={false}
                float={true}
              />
            </div>
          </div>
        </AnimationContainer>
      </MaxWidthWrapper>
    </section>
  );
};

export default ProcessSection;
