"use client";

import React from "react";
import { METRICS } from "@/config/landing-data";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";

export const MetricsSection = () => {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-orange-50/40 via-white to-transparent dark:from-zinc-900/40 dark:via-zinc-950 dark:to-transparent border-y border-orange-100/60 dark:border-zinc-800">
      <MaxWidthWrapper>
        <AnimationContainer delay={0.1}>
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Con số ấn tượng
            </h3>
            <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Đồng hành cùng hàng nghìn giáo viên trên toàn quốc
            </p>
          </div>
        </AnimationContainer>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {METRICS.map((metric, idx) => (
            <AnimationContainer key={metric.label} delay={0.1 + idx * 0.08}>
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:border-orange-200 dark:hover:border-orange-800 transition-colors text-center group">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-amber-600 group-hover:scale-105 transition-transform duration-300">
                  {metric.value}
                </span>
                <span className="mt-2 text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100">
                  {metric.label}
                </span>
                <span className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {metric.description}
                </span>
              </div>
            </AnimationContainer>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default MetricsSection;
