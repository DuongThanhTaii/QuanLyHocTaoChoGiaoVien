"use client";

import React, { useState } from "react";
import { FAQS } from "@/config/landing-data";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <MaxWidthWrapper>
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-16">
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Giải đáp thắc mắc" />
          </AnimationContainer>

          <AnimationContainer delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Câu hỏi{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                thường gặp
              </span>
            </h2>
          </AnimationContainer>

          <AnimationContainer delay={0.15}>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              Mọi điều bạn cần biết về cách thức hoạt động, độ bảo mật và chi phí của Mari.
            </p>
          </AnimationContainer>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <AnimationContainer key={faq.question} delay={0.1 + idx * 0.08}>
                <div
                  className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-zinc-900",
                    isOpen
                      ? "border-orange-300 dark:border-orange-800/80 shadow-md shadow-orange-500/5"
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                  )}
                >
                  <button
                    onClick={() => toggleFAQ(idx)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
                  >
                    <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white pr-4">
                      {faq.question}
                    </span>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200",
                        isOpen
                          ? "rotate-180 bg-orange-100 dark:bg-orange-950 text-orange-600"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-500"
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60 pt-4 animate-in fade-in-50 duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </AnimationContainer>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default FAQSection;
