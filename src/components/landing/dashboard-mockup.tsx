"use client";

import React, { useState } from "react";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  Users,
  CalendarCheck,
  CreditCard,
  QrCode,
  TrendingUp,
  CheckCircle2,
  Bell,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const DashboardMockup = () => {
  const [imgSrcIndex, setImgSrcIndex] = useState(0);
  const imageSources = [
    "/images/landing/hero-dashboard.png",
    "/images/dashboard-preview.png",
  ];
  const isImageAvailable = imgSrcIndex < imageSources.length;

  return (
    <div className="relative w-full rounded-2xl md:rounded-3xl p-1.5 sm:p-3 bg-gradient-to-b from-orange-500/20 via-orange-500/5 to-transparent backdrop-blur-xl border border-orange-200/60 dark:border-orange-500/20 shadow-2xl shadow-orange-500/10">
      {/* Border beam effect */}
      <BorderBeam size={280} duration={14} colorFrom="#f97316" colorTo="#fbbf24" borderWidth={2} />

      {/* Browser mockup window */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 shadow-inner">
        {/* Browser Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>

          <div className="flex items-center justify-center flex-1 max-w-sm mx-auto">
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full w-full justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono truncate">mari.vn/teacher/dashboard</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
            <Bell className="w-3.5 h-3.5" />
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px]">
              GV
            </div>
          </div>
        </div>

        {/* Content Area: Real Image (if available) or High-Fidelity UI Placeholder */}
        <div className="relative min-h-[380px] sm:min-h-[500px] lg:min-h-[580px] bg-slate-50/60 dark:bg-zinc-950">
          {isImageAvailable ? (
            <div className="relative w-full h-full min-h-[380px] sm:min-h-[500px]">
              <Image
                src={imageSources[imgSrcIndex]}
              alt="Mari Dashboard Preview"
                width={1400}
                height={850}
                quality={95}
                priority
                onError={() => setImgSrcIndex((prev) => prev + 1)}
                className="w-full h-auto object-cover rounded-b-xl"
              />
            </div>
          ) : (
            // High Fidelity Mockup UI when real image is not uploaded yet
            <div className="p-4 sm:p-6 lg:p-8 space-y-5 select-none pointer-events-none">
              {/* Header inside dashboard */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      Xin chào, Thầy Nguyễn Văn An 👋
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      Giáo viên Pro
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                    Hôm nay bạn có 2 buổi dạy và 32 lượt điểm danh cần xác nhận.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-white font-medium shadow-sm">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mở QR Điểm danh</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Lớp đang dạy</span>
                    <Users className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">4</span>
                    <span className="text-xs text-emerald-600 font-medium">+1 lớp mới</span>
                  </div>
                  <span className="text-[11px] text-slate-400">68 học sinh đang theo học</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Chuyên cần tuần</span>
                    <CalendarCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">96.8%</span>
                    <span className="text-xs text-emerald-600 font-medium">Tốt</span>
                  </div>
                  <span className="text-[11px] text-slate-400">65/68 học sinh có mặt</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Học phí tháng này</span>
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">28.4Tr</span>
                    <span className="text-xs text-emerald-600 font-medium">↑ 12%</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Đã thu 88% qua VietQR</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Tiết kiệm thời gian</span>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">6.5h</span>
                    <span className="text-xs text-slate-500">/tuần</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Tự động gạch nợ học phí</span>
                </div>
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Classes & Today Schedule */}
                <div className="lg:col-span-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Lịch dạy hôm nay & Điểm danh nhanh
                    </h4>
                    <span className="text-xs text-orange-600 font-medium cursor-pointer">Xem tất cả</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex flex-col items-center justify-center font-bold text-xs">
                          <span>17:30</span>
                          <span className="w-full text-center text-[9px] font-normal">Hôm nay</span>
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">
                            Toán 12 - Luyện đề THPT Quốc Gia
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Phòng 201 • 24 học sinh</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 23/24 Đã điểm danh
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-700/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex flex-col items-center justify-center font-bold text-xs">
                          <span>19:30</span>
                          <span className="text-[9px] font-normal">Tối nay</span>
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">
                            Toán 11 - Nâng cao Hình không gian
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400">Trực tuyến Zoom • 18 học sinh</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-100 rounded-md">
                          Sắp diễn ra
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: VietQR Live notification simulation */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Giao dịch VietQR tự động
                    </h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                      <div className="flex justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                        <span>+ 1.200.000đ</span>
                        <span className="text-[10px] font-normal text-emerald-600">2 phút trước</span>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-300 mt-0.5 truncate">
                        Phụ huynh HS: <strong>Trần Minh Quân (12A1)</strong>
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                        ✓ Đã gạch nợ học phí Tháng 09
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700">
                      <div className="flex justify-between font-semibold text-slate-800 dark:text-zinc-200">
                        <span>+ 1.500.000đ</span>
                        <span className="text-[10px] font-normal text-slate-400">1 giờ trước</span>
                      </div>
                      <p className="text-slate-600 dark:text-zinc-300 mt-0.5 truncate">
                        Phụ huynh HS: <strong>Lê Hoàng Long (11A2)</strong>
                      </p>
                      <p className="text-[10px] text-emerald-600 font-mono mt-1">
                        ✓ Đã gạch nợ học phí Tháng 09
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom gradient fade */}
          <div className="absolute -bottom-1 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;
