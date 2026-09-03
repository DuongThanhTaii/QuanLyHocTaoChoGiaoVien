"use client";
import { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate } from "motion/react";
import type { AnimatedIconHandle, AnimatedIconProps } from "../types";
const SparklesIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(({ size = 24, color = "currentColor", strokeWidth = 1.6, className = "" }, ref) => {
  const [scope, animate] = useAnimate();
  const start = () => { animate(".sparkle-main", { rotate: 180, scale: [1, 1.2, 1] }, { duration: 0.6 }); animate(".sparkle-top", { rotate: -90, scale: [1, .8, 1.1], opacity: [1, .6, 1] }, { duration: .5, delay: .1 }); animate(".sparkle-bottom", { rotate: 90, scale: [1, 1.15, .9], opacity: [1, .7, 1] }, { duration: .5, delay: .05 }); };
  const stop = () => { animate(".sparkle-main, .sparkle-top, .sparkle-bottom", { rotate: 0, scale: 1, opacity: 1 }, { duration: .25 }); };
  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));
  return <motion.svg ref={scope} onHoverStart={start} onHoverEnd={stop} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ overflow: "visible" }}><motion.path className="sparkle-bottom" d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" /><motion.path className="sparkle-top" d="M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z" /><motion.path className="sparkle-main" d="M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" /></motion.svg>;
});
SparklesIcon.displayName = "SparklesIcon";
export default SparklesIcon;
