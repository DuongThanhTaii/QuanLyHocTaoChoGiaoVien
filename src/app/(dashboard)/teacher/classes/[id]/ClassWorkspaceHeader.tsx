'use client';

export function ClassWorkspaceHeader({ classId, name, subject, fee }: { classId: string; name: string; subject: string | null; fee: number | null }) {
  void classId; void subject; void fee;
  return <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800"><h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{name}</h1></div>;
}
