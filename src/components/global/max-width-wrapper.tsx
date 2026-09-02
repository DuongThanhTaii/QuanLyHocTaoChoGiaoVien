import { cn } from "@/lib/utils";
import React from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
}

export const MaxWidthWrapper = ({ className, children }: Props) => {
  return (
    <section
      className={cn(
        "h-full mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </section>
  );
};

export default MaxWidthWrapper;
