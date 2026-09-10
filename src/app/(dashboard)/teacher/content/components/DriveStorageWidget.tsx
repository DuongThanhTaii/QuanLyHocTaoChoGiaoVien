"use client";

import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type StorageMetric = { used: number; limit: number | null; remaining: number | null; percent: number | null; isNearLimit: boolean; isExhausted: boolean };
type StorageResponse = { isLinked: boolean; storage?: StorageMetric };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 * 1024 ? 1 : 0)} GB`;
}

export function DriveStorageWidget() {
  const [storage, setStorage] = useState<StorageMetric | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/teacher/content/storage', { cache: 'no-store' });
        const data = await response.json().catch(() => null) as StorageResponse | null;
        if (!response.ok || !data?.isLinked || !data.storage) throw new Error('Storage unavailable');
        setStorage(data.storage); setState('ready');
      } catch { setState('error'); }
    };
    void load();
    window.addEventListener('materials:changed', load);
    return () => window.removeEventListener('materials:changed', load);
  }, []);

  if (state === 'loading') return <div aria-label="Đang tải dung lượng kho tệp" className="flex min-w-40 items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-700"><HardDrive className="size-4 text-zinc-400" /><div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-1.5 w-28 rounded-full" /></div></div>;
  if (state === 'error' || !storage) return <div className="flex items-center gap-2 border-l border-zinc-200 pl-3 text-xs text-zinc-500 dark:border-zinc-700"><HardDrive className="size-4" />Không tải được dung lượng</div>;
  const percent = Math.min(storage.percent ?? 0, 100);
  const progressTone = storage.isExhausted ? 'bg-destructive' : storage.isNearLimit ? 'bg-amber-500' : 'bg-primary';
  const detail = storage.limit === null ? `${formatBytes(storage.used)} · Không giới hạn` : `${formatBytes(storage.used)} / ${formatBytes(storage.limit)}`;
  return <div className="flex min-w-40 items-center gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-700"><HardDrive className="size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Kho tệp · {detail}</p>{storage.limit !== null && <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"><div className={`h-full rounded-full transition-[width] ${progressTone}`} style={{ width: `${percent}%` }} /></div>}</div></div>;
}
