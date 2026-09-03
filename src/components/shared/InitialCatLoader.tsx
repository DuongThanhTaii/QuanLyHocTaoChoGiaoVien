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
        {/* Video con mèo */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
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

        {/* Logo & Tên hệ thống */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Mari
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <span>Đang chuẩn bị không gian làm việc</span>
            <span className="inline-flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </p>
        </div>

        {/* Thanh loading bar mượt mà */}
        <div className="w-48 sm:w-56 h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary rounded-full animate-pulse bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
        </div>
      </div>
    </div>
  );
}
