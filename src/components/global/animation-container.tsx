"use client";

import { motion } from "framer-motion";
import React from "react";

interface AnimationContainerProps {
  children: React.ReactNode;
  delay?: number;
  reverse?: boolean;
  className?: string;
}

export const AnimationContainer = ({
  children,
  className,
  reverse,
  delay = 0,
}: AnimationContainerProps) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reverse ? -16 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimationContainer;
