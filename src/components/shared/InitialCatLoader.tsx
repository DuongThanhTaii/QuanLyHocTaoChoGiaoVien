"use client";

import { useEffect, useState } from "react";

export function InitialCatLoader() {
  const [show, setShow] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Kiểm tra xem người dùng đã truy cập trong phiên này chưa
    const hasVisited = sessionStorage.getItem("giasupro_visited_session");
    
    if (!hasVisited) {
      setShow(true);
      // Đánh dấu đã truy cập trong session hiện tại
      sessionStorage.setItem("giasupro_visited_session", "true");

      // Giữ màn hình chào đủ lâu để nhận diện Mari trước khi vào app.
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
      <div className="flex w-full flex-col items-center justify-center gap-3 px-6 text-center sm:gap-4">
        <img
          src="/images/empty_states/cat_stand.png"
          alt="Mari"
          className="h-auto w-[min(44vw,210px)] min-w-[128px] object-contain drop-shadow-[0_12px_14px_rgba(150,75,24,0.16)] sm:w-[min(32vw,230px)]"
        />
        <img
          src="/images/empty_states/logo_text.webp"
          alt="Mari"
          className="h-auto w-[min(66vw,230px)] object-contain"
        />
      </div>
    </div>
  );
}
