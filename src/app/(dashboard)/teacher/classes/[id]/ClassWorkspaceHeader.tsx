'use client';

import { usePathname } from 'next/navigation';

export function ClassWorkspaceHeader({ classId, name, subject, fee }: { classId: string; name: string; subject: string | null; fee: number | null }) {
  const isOverview = usePathname() === `/teacher/classes/${classId}`;
  if (!isOverview) return <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800"><h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{name}</h1></div>;
  return <div className="rounded-xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-bold text-foreground">{name}</h1><p className="text-zinc-500">{subject || 'Chưa cập nhật môn học'} &bull; {Number(fee || 0).toLocaleString('vi-VN')} đ/buổi</p></div>;
}
