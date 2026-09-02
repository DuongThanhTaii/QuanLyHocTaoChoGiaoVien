"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type CatVariant = "stand" | "sitdown" | "sleep";

interface CatMascotProps {
  variant?: CatVariant;
  className?: string;
  speechText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSpeechOnHover?: boolean;
  alwaysShowSpeech?: boolean;
  float?: boolean;
}

const CAT_IMAGES: Record<CatVariant, { src: string; alt: string; aspect: string }> = {
  stand: {
    src: "/images/empty_states/cat_stand.png",
    alt: "Gia Sư Pro Mascot Mèo Đứng",
    aspect: "aspect-[300/420]",
  },
  sitdown: {
    src: "/images/empty_states/cat_sitdown.png",
    alt: "Gia Sư Pro Mascot Mèo Ngồi",
    aspect: "aspect-[300/380]",
  },
  sleep: {
    src: "/images/empty_states/empty_cat.png",
    alt: "Gia Sư Pro Mascot Mèo Ngủ Thảnh Thơi",
    aspect: "aspect-[16/10]",
  },
};

const SIZE_CLASSES = {
  sm: "w-20 sm:w-24",
  md: "w-28 sm:w-36",
  lg: "w-36 sm:w-48",
  xl: "w-48 sm:w-64",
};

export const CatMascot = ({
  variant = "stand",
  className,
  speechText = "Thầy/Cô chỉ việc dạy hay,\nsổ sách cứ để em lo! 🐾",
  size = "md",
  showSpeechOnHover = true,
  alwaysShowSpeech = false,
  float = true,
}: CatMascotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [clickedTimes, setClickedTimes] = useState(0);

  const catData = CAT_IMAGES[variant];

  // Chuẩn hóa xuống dòng: dòng 1 tới "dạy hay,", dòng 2 bắt đầu từ "sổ sách"
  const formattedDefaultSpeech = speechText.includes("\n")
    ? speechText
    : speechText.replace("sổ sách", "\nsổ sách");

  const dialogues = [
    formattedDefaultSpeech,
    "Điểm danh QR\ncực nhanh luôn ạ! ⚡",
    "Học phí gạch nợ\ntự động 100%! 💰",
    "Meo meo! Chúc Thầy/Cô\nmột ngày dạy vui vẻ! ❤️",
  ];
  const currentDialogue = dialogues[clickedTimes % dialogues.length];

  return (
    <div
      className={cn("relative inline-flex flex-col items-center select-none cursor-pointer group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setClickedTimes((prev) => prev + 1)}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {(alwaysShowSpeech || (showSpeechOnHover && isHovered)) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className="absolute -top-20 sm:-top-22 z-30 w-max max-w-[245px] px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800/60 shadow-xl shadow-orange-500/15 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 text-center pointer-events-none whitespace-pre-line"
          >
            <div className="relative leading-snug">
              {currentDialogue}
              {/* Arrow pointing down to cat */}
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[7px] border-t-white dark:border-t-zinc-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mascot Body */}
      <motion.div
        animate={
          float
            ? {
                y: [0, -8, 0],
                rotate: isHovered ? [0, -4, 4, 0] : [0, -1, 1, 0],
              }
            : {}
        }
        transition={{
          y: {
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: isHovered ? 0.6 : 4,
            repeat: isHovered ? 0 : Infinity,
            ease: "easeInOut",
          },
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className={cn("relative", SIZE_CLASSES[size])}
      >
        {/* Soft shadow under the cat */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 bg-black/10 dark:bg-black/30 rounded-full blur-xs" />

        <Image
          src={catData.src}
          alt={catData.alt}
          width={280}
          height={380}
          priority
          className="w-full h-auto object-contain drop-shadow-md transition-transform duration-300 pointer-events-none"
        />
      </motion.div>
    </div>
  );
};

export default CatMascot;
