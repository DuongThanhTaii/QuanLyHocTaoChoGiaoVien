"use client";

import React from "react";
import { TESTIMONIALS } from "@/config/landing-data";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Star } from "lucide-react";

export const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="py-20 sm:py-28 bg-slate-50/50 dark:bg-zinc-950/50 border-t border-slate-200/80 dark:border-zinc-800"
    >
      <MaxWidthWrapper>
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-16">
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Khách hàng nói gì" />
          </AnimationContainer>

          <AnimationContainer delay={0.1}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Được tin cậy bởi các thầy cô{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                tâm huyết nhất
              </span>
            </h2>
          </AnimationContainer>

          <AnimationContainer delay={0.15}>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300 md:whitespace-nowrap">
              Cùng lắng nghe chia sẻ từ những người đang dùng Gia Sư Pro mỗi
              ngày để tối ưu hóa việc dạy và học.
            </p>
          </AnimationContainer>
        </div>

        {/* 2-column or 4-grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((review, idx) => (
            <AnimationContainer key={review.name} delay={0.1 + idx * 0.1}>
              <div className="h-full flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-orange-200 dark:hover:border-zinc-700 transition-all duration-200">
                <div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-200 leading-relaxed italic">
                    "{review.content}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-3.5">
                  <UserAvatar
                    name={review.name}
                    size="md"
                    className="ring-2 ring-orange-200 dark:ring-orange-900"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {review.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {review.role}
                    </p>
                  </div>
                </div>
              </div>
            </AnimationContainer>
          ))}
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default TestimonialsSection;
