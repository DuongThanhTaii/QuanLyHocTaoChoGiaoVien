"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  QrCode,
  CreditCard,
  Calendar,
  MessageSquare,
  Check,
  Sparkles,
  Bell,
  ArrowRight,
} from "lucide-react";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { AnimationContainer } from "@/components/global/animation-container";
import { MagicBadge } from "@/components/ui/magic-badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Component hỗ trợ hiển thị ảnh thật khi người dùng upload vào public/images/landing/
// Nếu chưa có ảnh, tự động hiển thị giao diện UI mockup làm mẫu
interface BentoMediaSlotProps {
  imageSrc: string;
  alt: string;
  fallback: React.ReactNode;
  heightClass?: string;
}

const BentoMediaSlot = ({
  imageSrc,
  alt,
  fallback,
  heightClass = "h-44 sm:h-56",
}: BentoMediaSlotProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return <>{fallback}</>;
  }

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 mt-6 shadow-xs transition-transform duration-300 ease-out group-hover:scale-[1.02]",
        heightClass,
      )}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover object-top"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
};

export const BentoFeatures = () => {
  return (
    <section id="features" className="py-20 sm:py-28 relative select-none">
      <MaxWidthWrapper>
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-16">
          <AnimationContainer delay={0.05}>
            <MagicBadge title="Tính năng đột phá" />
          </AnimationContainer>

          <AnimationContainer delay={0.1}>
            <h2 className="mt-4 pd-1 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Mọi công cụ bạn cần để <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                vận hành lớp học
              </span>
            </h2>
          </AnimationContainer>

          <AnimationContainer delay={0.15}>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-zinc-300">
              Thay thế hoàn toàn bảng tính Excel rối rắm, tin nhắn Messenger
              phân tán <br /> và việc đối soát học phí thủ công nhọc nhằn.
            </p>
          </AnimationContainer>
        </div>

        {/* Bento Grid Layout matching Linkify interactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Điểm danh QR 1 Chạm (Span 2 Cols) - Ảnh: /images/landing/feature-1.png */}
          <AnimationContainer delay={0.2} className="lg:col-span-2">
            <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-800 transition-all duration-300 [box-shadow:0_-20px_80px_-20px_rgba(249,115,22,0.06)_inset]">
              <div className="z-10 transition-all duration-300 group-hover:-translate-y-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-75 origin-left">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Điểm danh thông minh & Quét mã QR 1 chạm
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-zinc-300 max-w-xl">
                  Mỗi học sinh có một thẻ định danh QR cá nhân. Giáo viên chỉ
                  cần quét 1 giây là hệ thống tự động ghi nhận chuyên cần và gửi
                  thông báo tức thì đến phụ huynh.
                </p>
              </div>

              {/* Ảnh thật 1: /images/landing/feature-1.png (Fallback UI nếu chưa upload) */}
              <BentoMediaSlot
                imageSrc="/images/landing/feature-1.png"
                alt="Tính năng điểm danh QR thông minh"
                heightClass="h-48 sm:h-60"
                fallback={
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                    <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Thẻ QR Học Sinh
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-800 font-mono">
                          #HS-2026
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-900 border border-orange-200 p-1 flex items-center justify-center shadow-xs">
                          <QrCode className="w-12 h-12 text-slate-800 dark:text-zinc-100" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Nguyễn Hoàng Long
                          </p>
                          <p className="text-xs text-slate-500">
                            Lớp 12A1 Toán VIP
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                            <Check className="w-3 h-3" /> Đã điểm danh 17:31
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 mb-1">
                        <Bell className="w-3.5 h-3.5 text-orange-500" />
                        Thông báo gửi Phụ huynh:
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                        "Kính gửi PH: Em Long đã có mặt tại lớp Toán lúc 17:31.
                        Buổi học bắt đầu đúng giờ!"
                      </p>
                    </div>
                  </div>
                }
              />

              {/* Linkify Signature Hover Slide-Up CTA Button */}
              <div className="absolute bottom-3 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </AnimationContainer>

          {/* Card 2: VietQR Tự động (Span 1 Col) - Ảnh: /images/landing/feature-2.png */}
          <AnimationContainer delay={0.25} className="lg:col-span-1">
            <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-800 transition-all duration-300 [box-shadow:0_-20px_80px_-20px_rgba(249,115,22,0.06)_inset]">
              <div className="z-10 transition-all duration-300 group-hover:-translate-y-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-75 origin-left">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tự động hóa học phí với VietQR động
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
                  Tự tạo mã VietQR theo số tiền học phí và cú pháp định danh.
                  Phụ huynh quét mã là gạch nợ tức thì 24/7.
                </p>
              </div>

              {/* Ảnh thật 2: /images/landing/feature-2.png (Fallback UI nếu chưa upload) */}
              <BentoMediaSlot
                imageSrc="/images/landing/feature-2.png"
                alt="Tính năng VietQR tự động hóa học phí"
                heightClass="h-44 sm:h-52"
                fallback={
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2 transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Hóa đơn học phí
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-bold">
                        TỰ ĐỘNG GẠCH NỢ
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      1.200.000 VNĐ
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Nội dung: HP T9 NGUYEN HOANG LONG
                    </div>
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5" /> Tiền vào tài khoản giáo
                      viên ngay
                    </div>
                  </div>
                }
              />

              {/* Linkify Signature Hover Slide-Up CTA Button */}
              <div className="absolute bottom-3 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </AnimationContainer>

          {/* Card 3: Thời khóa biểu & Lịch dạy (Span 1 Col) - Ảnh: /images/landing/feature-3.png */}
          <AnimationContainer delay={0.3} className="lg:col-span-1">
            <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-800 transition-all duration-300 [box-shadow:0_-20px_80px_-20px_rgba(249,115,22,0.06)_inset]">
              <div className="z-10 transition-all duration-300 group-hover:-translate-y-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-75 origin-left">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Thời khóa biểu & Lịch dạy thông minh
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
                  Lên lịch dạy trực quan, thông báo đổi lịch, báo học bù hoặc
                  nghỉ học tự động mà không cần nhắn từng người.
                </p>
              </div>

              {/* Ảnh thật 3: /images/landing/feature-3.png (Fallback UI nếu chưa upload) */}
              <BentoMediaSlot
                imageSrc="/images/landing/feature-3.png"
                alt="Tính năng thời khóa biểu và lịch dạy"
                heightClass="h-44 sm:h-52"
                fallback={
                  <div className="mt-6 space-y-2 transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Thứ 3 & Thứ 5 (17:30 - 19:30)
                        </p>
                        <p className="text-slate-500">Lớp Toán 12 Nâng Cao</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-medium text-[11px]">
                        Đang học
                      </span>
                    </div>
                  </div>
                }
              />

              {/* Linkify Signature Hover Slide-Up CTA Button */}
              <div className="absolute bottom-3 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </AnimationContainer>

          {/* Card 4: Sổ liên lạc & Kết nối 3 bên (Span 2 Cols) - Ảnh: /images/landing/feature-4.png */}
          <AnimationContainer delay={0.35} className="lg:col-span-2">
            <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-800 transition-all duration-300 [box-shadow:0_-20px_80px_-20px_rgba(249,115,22,0.06)_inset]">
              <div className="z-10 transition-all duration-300 group-hover:-translate-y-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-75 origin-left">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Sổ liên lạc số & Kết nối 3 bên Giáo viên - Phụ huynh - Học
                  sinh
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-zinc-300 max-w-xl">
                  Gửi nhận xét kết quả học tập, chia sẻ file bài giảng, phiếu
                  bài tập và giao bài về nhà. Tách biệt hoàn toàn công việc
                  giảng dạy khỏi tin nhắn cá nhân.
                </p>
              </div>

              {/* Ảnh thật 4: /images/landing/feature-4.png (Fallback UI nếu chưa upload) */}
              <BentoMediaSlot
                imageSrc="/images/landing/feature-4.png"
                alt="Tính năng sổ liên lạc số"
                heightClass="h-48 sm:h-60"
                fallback={
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3 transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                    <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-zinc-800/60 border border-orange-100 dark:border-zinc-700 text-xs space-y-1">
                      <span className="font-bold text-orange-700 dark:text-orange-400">
                        Thầy An (Giáo viên):
                      </span>
                      <p className="text-slate-700 dark:text-zinc-200">
                        "Hôm nay em Kiệt làm bài tập Hình học rất tốt, đạt 9/10
                        điểm bài kiểm tra 15 phút."
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-1">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">
                        Mẹ Tuấn Kiệt:
                      </span>
                      <p className="text-slate-600 dark:text-zinc-400">
                        "Cảm ơn Thầy đã luôn tận tâm theo sát tiến độ học tập
                        của cháu ạ!"
                      </p>
                    </div>
                  </div>
                }
              />

              {/* Linkify Signature Hover Slide-Up CTA Button */}
              <div className="absolute bottom-3 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
                >
                  <span>Khám phá ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </AnimationContainer>
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default BentoFeatures;
