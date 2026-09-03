"use client";

import { useEffect, useState, useRef } from "react";

export function InitialCatLoader() {
  const [show, setShow] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Kiểm tra xem người dùng đã truy cập trong phiên này chưa
    const hasVisited = sessionStorage.getItem("giasupro_visited_session");
    
    if (!hasVisited) {
      setShow(true);
      // Đánh dấu đã truy cập trong session hiện tại
      sessionStorage.setItem("giasupro_visited_session", "true");

      // Tự động phát video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }

      // Giữ màn hình chào khoảng 1.4 giây để người dùng thưởng thức animation con mèo
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 1400);

      // Sau khi hiệu ứng fade-out 500ms kết thúc, unmount hoàn toàn khỏi DOM
      const removeTimer = setTimeout(() => {
        setShow(false);
      }, 1900);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-500 select-none ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ willChange: "opacity" }}
    >
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {/* Desktop: loading animation */}
        <div className="relative hidden h-44 w-44 items-center justify-center lg:flex sm:h-52 sm:w-52">
          <video
            ref={videoRef}
            src="/loading.webm"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-contain pointer-events-none"
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>

        {/* Mobile/tablet: use the static logo as the loading mark */}
        <div className="flex items-center justify-center lg:hidden">
          <img src="/images/empty_states/logo_text.webp" alt="Mari" className="h-auto w-[min(76vw,280px)] object-contain" />
        </div>

        <div className="text-center">
          <img src="/images/empty_states/logo_text.webp" alt="Mari" className="mx-auto hidden h-[50px] w-[180px] object-contain lg:block" />
        </div>

      </div>
    </div>
  );
}
