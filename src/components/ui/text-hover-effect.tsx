"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TextHoverEffectProps {
  text: string;
  className?: string;
  duration?: number;
}

export const TextHoverEffect = ({ text, className }: TextHoverEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: -500, y: -500 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full py-6 sm:py-10 flex items-center justify-center select-none cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* 
        LỚP 1: Đường viền cơ bản của font Montserrat (Light mode & Dark mode)
        Dùng WebkitTextStroke kết hợp text-transparent:
        - Ruột chữ HOÀN TOÀN TRONG SUỐT (hollow) chuẩn 100% theo Linkify
        - Trình duyệt tự động hợp nhất các contour (glyph union) -> LOẠI BỎ TRIỆT ĐỂ 100% CÁC Ô TAM GIÁC trong G, A, P, R!
      */}
      <span
        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.14em] text-transparent transition-opacity duration-300 dark:hidden"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          WebkitTextStroke: "1px rgba(203, 213, 225, 0.85)", // slate-300
        }}
      >
        {text}
      </span>

      <span
        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.14em] text-transparent transition-opacity duration-300 hidden dark:inline-block"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          WebkitTextStroke: "1px rgba(63, 63, 70, 0.85)", // zinc-700
        }}
      >
        {text}
      </span>

      {/* 
        LỚP 2: Nét viền Laser Cam phát sáng bám theo con trỏ chuột
        - Vẫn là nét viền (WebkitTextStroke: 1.2px #f97316), ruột chữ VẪN TRONG SUỐT
        - Khi rê chuột đến đâu, đường viền cam tỏa sáng lấp lánh đến đó kèm hiệu ứng drop-shadow neon ấm áp
      */}
      <span
        className="absolute text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[0.14em] text-transparent pointer-events-none transition-opacity duration-200"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          WebkitTextStroke: "1.4px #f97316",
          filter: "drop-shadow(0 0 12px rgba(249, 115, 22, 0.6))",
          opacity: hovered ? 1 : 0,
          maskImage: `radial-gradient(180px circle at ${cursor.x}px ${cursor.y}px, black 30%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(180px circle at ${cursor.x}px ${cursor.y}px, black 30%, transparent 100%)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default TextHoverEffect;
