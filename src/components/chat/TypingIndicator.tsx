'use client';

import React from 'react';
import { TypingUser } from '@/infrastructure/realtime/use-supabase-realtime';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.userName).join(', ');
  const label = typingUsers.length === 1 ? `${names} đang soạn tin...` : `${names} đang soạn tin...`;

  return (
    <div className="flex items-center gap-2 py-1 px-3 text-xs text-zinc-500 animate-in fade-in duration-200">
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200/80 shadow-xs">
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
      </div>
      <span className="text-[11px] text-zinc-500 font-medium italic truncate max-w-[200px]">
        {label}
      </span>
    </div>
  );
}
