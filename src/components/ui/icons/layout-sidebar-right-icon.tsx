"use client";
import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate } from "motion/react";
import type { AnimatedIconHandle, AnimatedIconProps } from "../types";
const LayoutSidebarRightIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(({ size = 24, color = "currentColor", strokeWidth = 1.6, className = "" }, ref) => { const [scope, animate] = useAnimate(); const start = () => { animate(".sidebar", { x: 2, scaleX: 1.1 }, { duration: .3 }); animate(".container", { scale: 1.02 }, { duration: .3 }); }; const stop = () => animate(".sidebar, .container", { x: 0, scaleX: 1, scale: 1 }, { duration: .25 }); useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop })); return <motion.svg ref={scope} onHoverStart={start} onHoverEnd={stop} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><path stroke="none" d="M0 0h24v24H0z" fill="none" /><motion.path className="container" d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-12a2 2 0 0 1-2 -2z" /><motion.path className="sidebar" d="M15 4l0 16" /></motion.svg>; });
LayoutSidebarRightIcon.displayName = "LayoutSidebarRightIcon";
export default LayoutSidebarRightIcon;
