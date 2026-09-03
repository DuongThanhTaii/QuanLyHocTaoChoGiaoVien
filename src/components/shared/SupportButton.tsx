'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Phone, 
  ExternalLink, 
  Clock
} from 'lucide-react';
import BrandChromeIcon from '@/components/ui/icons/brand-chrome-icon';
import type { AnimatedIconHandle } from '@/components/ui/types';

interface SupportButtonProps {
  isCollapsed?: boolean;
  variant?: 'sidebar' | 'floating';
}

const SUPPORT_CONFIG = {
  phone: "0356.170.187",
  phoneRaw: "0356170187",
  email: "duongthanhtai1308@gmail.com",
  zalo: "https://zalo.me/0356170187",
  messenger: "https://m.me/giasupro",
};

function ZaloLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0068FF] text-white flex items-center justify-center shrink-0 shadow-xs select-none">
      <span className="text-[13px] font-black tracking-tight leading-none">Zalo</span>
    </div>
  );
}

function MessengerLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#006AFF] via-[#00B2FF] to-[#A033FF] text-white flex items-center justify-center shrink-0 shadow-xs">
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.453 5.517 3.731 7.224V22l3.356-1.844c.915.254 1.889.391 2.913.391 5.523 0 10-4.145 10-9.288C22 6.145 17.523 2 12 2zm1.042 12.445l-2.604-2.778-5.08 2.778 5.592-5.932 2.67 2.778 5.014-2.778-5.592 5.932z"/>
      </svg>
    </div>
  );
}

function GmailLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
      <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M43.5 12.5v23a3 3 0 0 1-3 3H36V22.2L43.5 16.5z"/>
        <path fill="#34A853" d="M4.5 12.5v23a3 3 0 0 0 3 3H12V22.2L4.5 16.5z"/>
        <path fill="#EA4335" d="M36 22.2V13l-12 9-12-9v9.2L4.5 16.5 24 31l19.5-14.5z"/>
        <path fill="#FBBC05" d="M12 13l12 9 12-9V9.5a3 3 0 0 0-4.8-2.4L24 12.3 16.8 7.1A3 3 0 0 0 12 9.5z"/>
        <path fill="#C5221F" d="M4.5 12.5l7.5 5.7V13L7.2 9.1a3 3 0 0 0-2.7 3.4z"/>
      </svg>
    </div>
  );
}

function HotlineLogo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
      <Phone className="w-5 h-5 fill-current" />
    </div>
  );
}

export function SupportButton({ isCollapsed = false, variant = 'sidebar' }: SupportButtonProps) {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<AnimatedIconHandle | null>(null);
  const setIconRef = useCallback((node: AnimatedIconHandle | null) => { iconRef.current = node; }, []);
  const isFloating = variant === 'floating';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            onMouseEnter={() => iconRef.current?.startAnimation()}
            onMouseLeave={() => iconRef.current?.stopAnimation()}
            className={isFloating
              ? 'fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              : 'group relative mb-2 flex w-full items-center overflow-hidden rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground outline-none transition-all duration-300 hover:bg-muted hover:text-foreground'}
            title={isCollapsed ? "Hỗ trợ" : undefined}
          />
        }
      >
        <BrandChromeIcon ref={setIconRef} size={20} strokeWidth={1.6} className={`size-5 shrink-0 transition-colors duration-300 ${isFloating ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
        
        <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-300 ${isFloating ? 'max-w-[150px] opacity-100' : isCollapsed ? 'max-w-0 opacity-0' : 'ml-3 max-w-[150px] opacity-100'}`}>
          <span className="z-10">Hỗ trợ</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Trung tâm Hỗ trợ & Trợ giúp
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Đội ngũ GiaSưPro luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kỹ thuật cho bạn
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5 py-2">
          {/* Zalo */}
          <a
            href={SUPPORT_CONFIG.zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <ZaloLogo />
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  Chat qua Zalo
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
                <div className="text-xs text-muted-foreground">Phản hồi nhanh • {SUPPORT_CONFIG.phone}</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900">
              Khuyên dùng
            </span>
          </a>

          {/* Facebook Messenger */}
          <a
            href={SUPPORT_CONFIG.messenger}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <MessengerLogo />
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  Chat qua Facebook Messenger
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
                <div className="text-xs text-muted-foreground">Fanpage chính thức GiaSưPro</div>
              </div>
            </div>
          </a>

          {/* Hotline */}
          <a
            href={`tel:${SUPPORT_CONFIG.phoneRaw}`}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <HotlineLogo />
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Hotline / Điện thoại
                </div>
                <div className="text-xs text-muted-foreground">{SUPPORT_CONFIG.phone}</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
              Gọi ngay
            </span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${SUPPORT_CONFIG.email}`}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <GmailLogo />
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Gửi thư điện tử (Email)
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">{SUPPORT_CONFIG.email}</div>
              </div>
            </div>
          </a>
        </div>

        {/* Info banner - high contrast & neat styling */}
        <div className="mt-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
            Nếu cần hỗ trợ kỹ thuật, bạn vui lòng gửi kèm ảnh chụp màn hình lỗi để được xử lý nhanh nhất.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
