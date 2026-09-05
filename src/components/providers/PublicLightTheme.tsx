"use client";

import { useEffect } from "react";

export function PublicLightTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return <>{children}</>;
}
