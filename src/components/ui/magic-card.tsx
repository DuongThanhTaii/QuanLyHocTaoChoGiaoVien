"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const MagicCard = ({
  children,
  className,
  glowColor = "rgba(249, 115, 22, 0.22)", // Vibrant Orange glow
}: Props) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 transition-all duration-300",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(450px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
};

export default MagicCard;
