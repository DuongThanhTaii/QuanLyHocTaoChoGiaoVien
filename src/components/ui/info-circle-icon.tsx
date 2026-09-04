"use client";

import { forwardRef, useCallback, useImperativeHandle } from 'react';
import { motion, useAnimate } from 'motion/react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';

const InfoCircleIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ size = 24, color = 'currentColor', strokeWidth = 2, className = '' }, ref) => {
    const [scope, animate] = useAnimate();

    const start = useCallback(async () => {
      await animate('.info-circle-dot', { pathLength: [0, 1] }, { duration: 0.3, ease: 'easeOut' });
      animate('.info-circle-line', { pathLength: [0, 1] }, { duration: 0.4, ease: 'easeOut' });
    }, [animate]);

    const stop = useCallback(() => {
      animate('.info-circle-dot, .info-circle-line', { pathLength: 1 }, { duration: 0.2, ease: 'easeInOut' });
    }, [animate]);

    useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));

    return <motion.svg
      ref={scope}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`cursor-pointer ${className}`}
      onHoverStart={start}
      onHoverEnd={stop}
    >
      <motion.path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <motion.path d="M12 9h.01" className="info-circle-dot" />
      <motion.path d="M11 12h1v4h1" className="info-circle-line" />
    </motion.svg>;
  },
);

InfoCircleIcon.displayName = 'InfoCircleIcon';

export default InfoCircleIcon;
