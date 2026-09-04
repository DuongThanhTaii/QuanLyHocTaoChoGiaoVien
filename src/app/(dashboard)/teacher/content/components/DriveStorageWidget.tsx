"use client";

import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';

type StorageMetric = { used: number; limit: number | null; remaining: number | null; percent: number | null; isNearLimit: boolean; isExhausted: boolean };
type StorageResponse = { isLinked: boolean; storage?: StorageMetric };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 * 1024 ? 1 : 0)} GB`;
}

export function DriveStorageWidget() {
  const [storage, setStorage] = useState<StorageMetric | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/teacher/content/storage', { cache: 'no-store' });
      const data = await response.json().catch(() => null) as StorageResponse | null;
      if (response.ok && data?.isLinked && data.storage) setStorage(data.storage);
    };
    void load();
    window.addEventListener('materials:changed', load);
    return () => window.removeEventListener('materials:changed', load);
  }, []);

  if (!storage) return null;
  const percent = Math.min(storage.percent ?? 0, 100);
  const progressTone = storage.isExhausted ? 'bg-destructive' : storage.isNearLimit ? 'bg-amber-500' : 'bg-primary';

  return <section className="rounded-xl border bg-card px-5 py-4 shadow-sm">
    <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><HardDrive className="size-5" /></span><div className="min-w-0"><h2 className="text-sm font-semibold">Dung lượng học liệu</h2><p className="mt-0.5 text-xs text-muted-foreground">{storage.limit === null ? `${formatBytes(storage.used)} đã dùng · Không giới hạn` : `Đã dùng ${formatBytes(storage.used)} / ${formatBytes(storage.limit)}`}</p></div></div>
    {storage.limit !== null && <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] ${progressTone}`} style={{ width: `${percent}%` }} /></div>}
  </section>;
}
