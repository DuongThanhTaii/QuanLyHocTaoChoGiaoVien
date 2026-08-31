'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    // Take first letter of last word (Vietnamese given name)
    const lastWord = parts[parts.length - 1];
    return lastWord[0].toUpperCase();
  }

  if (email && email.trim()) {
    return email.trim()[0].toUpperCase();
  }

  return 'U';
}

const colorPalette = [
  { bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-200/60 dark:ring-emerald-800/60' },
  { bg: 'bg-blue-100 dark:bg-blue-950/70', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-200/60 dark:ring-blue-800/60' },
  { bg: 'bg-purple-100 dark:bg-purple-950/70', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-200/60 dark:ring-purple-800/60' },
  { bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-200/60 dark:ring-amber-800/60' },
  { bg: 'bg-rose-100 dark:bg-rose-950/70', text: 'text-rose-700 dark:text-rose-300', ring: 'ring-rose-200/60 dark:ring-rose-800/60' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/70', text: 'text-indigo-700 dark:text-indigo-300', ring: 'ring-indigo-200/60 dark:ring-indigo-800/60' },
  { bg: 'bg-teal-100 dark:bg-teal-950/70', text: 'text-teal-700 dark:text-teal-300', ring: 'ring-teal-200/60 dark:ring-teal-800/60' },
  { bg: 'bg-orange-100 dark:bg-orange-950/70', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-200/60 dark:ring-orange-800/60' },
];

export function getAvatarColor(key?: string | null) {
  if (!key) return colorPalette[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-14 h-14 text-xl',
};

export function UserAvatar({ name, email, size = 'md', className }: UserAvatarProps) {
  const initial = getInitials(name, email);
  const color = getAvatarColor(name || email || 'user');

  return (
    <div
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center font-bold select-none ring-1 shadow-2xs transition-transform',
        sizeClasses[size],
        color.bg,
        color.text,
        color.ring,
        className
      )}
      title={name || email || 'Người dùng'}
    >
      {initial}
    </div>
  );
}
