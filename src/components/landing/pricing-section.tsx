"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PRICING_PLANS } from "@/config/landing-data";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import { Check, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <MaxWidthWrapper>
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12">
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Bảng giá minh bạch" />
          </AnimationContainer>

          <AnimationContainer delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Chọn gói dịch vụ{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                phù hợp với bạn
              </span>
            </h2>
          </AnimationContainer>

          <AnimationContainer delay={0.15}>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              Khởi đầu hoàn toàn miễn phí. Nâng cấp bất cứ khi nào bạn muốn mở rộng quy mô lớp học.
            </p>
          </AnimationContainer>

          {/* Billing Cycle Toggle */}
          <AnimationContainer delay={0.2} className="mt-8">
            <div className="inline-flex items-center p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200",
                  !isYearly
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                )}
              >
                Thanh toán theo tháng
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200",
                  isYearly
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                )}
              >
                <span>Thanh toán theo năm</span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-white text-orange-600 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </AnimationContainer>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan, idx) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;

            return (
              <AnimationContainer key={plan.name} delay={0.1 + idx * 0.1} className="h-full">
                <div
                  className={cn(
                    "relative h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 transition-all duration-300",
                    plan.popular
                      ? "border-2 border-orange-500 shadow-xl shadow-orange-500/10 lg:-translate-y-2"
                      : "border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-orange-200 dark:hover:border-zinc-700"
                  )}
                >
                  {/* Popular Highlight Tag */}
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{plan.highlightBadge}</span>
                    </div>
                  )}

                  <div>
                    {/* Tier Name & Description */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 min-h-[32px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-slate-100 dark:border-zinc-800 flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono">
                        {price}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        /{plan.period}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-zinc-300">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={plan.popular ? "/register" : plan.tier === "starter" ? "/register" : "#contact"}
                    className={cn(
                      "w-full py-3 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all duration-200 active:scale-95",
                      plan.popular
                        ? "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700"
                    )}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </AnimationContainer>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default PricingSection;
