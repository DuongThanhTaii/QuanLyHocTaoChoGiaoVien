'use client';

import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LifeBuoy, Mail, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

interface SupportButtonProps {
  isCollapsed: boolean;
}

const SUPPORT_CONFIG = {
  email: "duongthanhtai1308@gmail.com",
  zalo: "https://zalo.me/0356170187",
  messenger: "https://m.me/giasupro",
};

export function SupportButton({ isCollapsed }: SupportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-300 overflow-hidden group mb-2 text-muted-foreground hover:text-foreground hover:bg-muted outline-none`}>
        <LifeBuoy className="w-5 h-5 shrink-0 transition-colors duration-300 text-muted-foreground group-hover:text-foreground" />
        
        <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex items-center ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
          <span className="z-10">Hỗ trợ</span>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" side="right" sideOffset={12} className="w-56 bg-popover border-border">
        <DropdownMenuLabel>Liên hệ Hỗ trợ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href={SUPPORT_CONFIG.zalo} target="_blank" />} className="cursor-pointer">
            <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
            Chat qua Zalo
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={SUPPORT_CONFIG.messenger} target="_blank" />} className="cursor-pointer">
            <MessageCircle className="w-4 h-4 mr-2 text-blue-600" />
            Chat qua Messenger
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={`mailto:${SUPPORT_CONFIG.email}`} />} className="cursor-pointer">
            <Mail className="w-4 h-4 mr-2 text-zinc-500" />
            Gửi Email
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
