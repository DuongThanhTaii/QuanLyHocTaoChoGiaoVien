"use client";

import React from "react";
import Link from "next/link";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import { SITE_CONFIG } from "@/config/landing-data";
import { Phone, Mail, MapPin, Heart } from "lucide-react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="relative bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 pt-16 pb-12 overflow-hidden select-none">
      <MaxWidthWrapper>
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-100 dark:border-zinc-800">
          {/* Col 1: Brand (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs flex items-center justify-center">
                <Image
                  src="/images/empty_states/logo.png"
                  alt="Mari"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                Mari
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Hệ sinh thái số toàn diện kết nối Giáo viên - Học sinh - Phụ huynh. Tiết kiệm thời gian quản lý, tự động hóa tài chính và nâng tầm chất lượng giảng dạy.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-500" />
                <span>Hotline: {SITE_CONFIG.contact.hotline}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-500" />
                <span>Email: {SITE_CONFIG.contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Địa chỉ: {SITE_CONFIG.contact.address}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Sản phẩm */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Sản phẩm
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li>
                <Link href="#features" className="hover:text-orange-600 transition-colors">
                  Điểm danh QR Code
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-orange-600 transition-colors">
                  Học phí VietQR tự động
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-orange-600 transition-colors">
                  Thời khóa biểu thông minh
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-orange-600 transition-colors">
                  Sổ liên lạc điện tử
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Dành cho */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Dành cho ai
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li>
                <Link href="/register" className="hover:text-orange-600 transition-colors">
                  Giáo viên tự do & Gia sư
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-orange-600 transition-colors">
                  Giáo viên trường học
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-orange-600 transition-colors">
                  Trung tâm bồi dưỡng văn hóa
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-orange-600 transition-colors">
                  Phụ huynh & Học sinh
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Pháp lý & Hỗ trợ */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Hỗ trợ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              <li>
                <Link href="/#faq" className="hover:text-orange-600 transition-colors">
                  Trung tâm trợ giúp (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-orange-600 transition-colors">
                  Bảng giá & Gói dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-600 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-600 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>


        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-500 pt-6">
          <p>
            &copy; {new Date().getFullYear()} Mari. Bảo lưu mọi quyền.
          </p>
          <p className="flex items-center gap-1">
            Được thiết kế với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> dành riêng cho Thầy/Cô Việt Nam
          </p>
        </div>
      </MaxWidthWrapper>
    </footer>
  );
};

export default Footer;
