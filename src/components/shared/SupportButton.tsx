'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  LifeBuoy, 
  Mail, 
  MessageCircle, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  Headset,
  Clock
} from 'lucide-react';

interface SupportButtonProps {
  isCollapsed?: boolean;
}

const SUPPORT_CONFIG = {
  phone: "0356.170.187",
  phoneRaw: "0356170187",
  email: "duongthanhtai1308@gmail.com",
  zalo: "https://zalo.me/0356170187",
  messenger: "https://m.me/giasupro",
};

export function SupportButton({ isCollapsed = false }: SupportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-300 overflow-hidden group mb-2 text-muted-foreground hover:text-foreground hover:bg-muted outline-none cursor-pointer text-left"
            title={isCollapsed ? "Hỗ trợ" : undefined}
          />
        }
      >
        <LifeBuoy className="w-5 h-5 shrink-0 transition-colors duration-300 text-muted-foreground group-hover:text-foreground" />
        
        <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex items-center ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
          <span className="z-10">Hỗ trợ</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Headset className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Trung tâm Hỗ trợ & Trợ giúp</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Đội ngũ GiaSưPro luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kỹ thuật cho bạn
              </DialogDescription>
            </div>
          </div>
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
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  Chat qua Zalo
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </div>
                <div className="text-xs text-muted-foreground">Phản hồi nhanh • {SUPPORT_CONFIG.phone}</div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
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
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
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
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Hotline / Điện thoại
                </div>
                <div className="text-xs text-muted-foreground">{SUPPORT_CONFIG.phone}</div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              Gọi ngay
            </span>
          </a>

          {/* Email */}
          <a
            href={`mailto:${SUPPORT_CONFIG.email}`}
            className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Gửi thư điện tử (Email)
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">{SUPPORT_CONFIG.email}</div>
              </div>
            </div>
          </a>
        </div>

        <div className="text-center text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời gian hỗ trợ: 8:00 - 22:00 hàng ngày</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80">
            Nếu cần hỗ trợ kỹ thuật, bạn vui lòng gửi kèm ảnh chụp màn hình lỗi để được xử lý nhanh nhất.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
