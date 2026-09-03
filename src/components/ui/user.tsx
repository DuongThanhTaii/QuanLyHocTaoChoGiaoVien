"use client";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
export interface UserIconHandle { startAnimation: () => void; stopAnimation: () => void }
interface UserIconProps extends HTMLAttributes<HTMLDivElement> { size?: number }
const UserIcon = forwardRef<UserIconHandle, UserIconProps>(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
  const controls = useAnimation(); const controlled = useRef(false);
  useImperativeHandle(ref, () => { controlled.current = true; return { startAnimation: () => controls.start("animate"), stopAnimation: () => controls.start("normal") }; });
  const enter = useCallback((e: React.MouseEvent<HTMLDivElement>) => controlled.current ? onMouseEnter?.(e) : controls.start("animate"), [controls, onMouseEnter]);
  const leave = useCallback((e: React.MouseEvent<HTMLDivElement>) => controlled.current ? onMouseLeave?.(e) : controls.start("normal"), [controls, onMouseLeave]);
  return <div className={cn(className)} onMouseEnter={enter} onMouseLeave={leave} {...props}><motion.svg animate={controls} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size}><motion.circle animate={controls} cx="12" cy="8" r="5" variants={{ normal: { pathLength: 1, scale: 1 }, animate: { pathLength: [0, 1], scale: [0.75, 1] } }} transition={{ duration: 0.28 }} /><motion.path animate={controls} d="M20 21a8 8 0 0 0-16 0" variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1] } }} transition={{ duration: 0.32, delay: 0.04 }} /></motion.svg></div>;
});
UserIcon.displayName = "UserIcon";
export { UserIcon };
