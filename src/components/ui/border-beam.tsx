"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}

export const BorderBeam = ({
  className,
  size = 280,
  duration = 10,
  borderWidth = 2,
  colorFrom = "#f97316", // Orange
  colorTo = "#fbbf24",   // Amber
}: BorderBeamProps) => {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      {/* SVG-based Border Beam: 100% Cross-Browser smooth 60fps orbiting laser beam */}
      <svg
        className="absolute inset-0 h-full w-full rounded-[inherit]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="orange-beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="60%" stopColor={colorTo} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          rx="20"
          ry="20"
          fill="none"
          stroke="url(#orange-beam-gradient)"
          strokeWidth={borderWidth * 2}
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="25 75"
          className="border-beam-svg-rect"
          style={
            {
              "--beam-duration": `${duration}s`,
            } as React.CSSProperties
          }
        />
      </svg>
    </div>
  );
};

export default BorderBeam;
