'use client';

import React from 'react';
import { TypingUser } from '@/infrastructure/realtime/use-supabase-realtime';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.userName).join(', ');
  const label = typingUsers.length === 1 
    ? `${names} đang soạn tin...` 
    : `${names} đang soạn tin...`;

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-1 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-center gap-1.5 bg-muted/80 dark:bg-zinc-800/80 px-3.5 py-2 rounded-2xl rounded-bl-xs border border-border/50 shadow-2xs">
        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
      </div>
      <span className="text-xs text-muted-foreground font-medium italic truncate max-w-[260px]">
        {label}
      </span>
    </div>
  );
}
