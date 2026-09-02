import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  className?: string;
}

export const MagicBadge = ({ title, className }: Props) => {
  return (
    <div
      className={cn(
        "relative inline-flex h-8 overflow-hidden rounded-full p-[1.5px] focus:outline-none select-none shadow-sm shadow-orange-500/10",
        className
      )}
    >
      <span className="absolute inset-[-1000%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f97316_0%,#fdba74_50%,#f97316_100%)]" />
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-zinc-900 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 backdrop-blur-3xl">
        {title}
      </span>
    </div>
  );
};

export default MagicBadge;
