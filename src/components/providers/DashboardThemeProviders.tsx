"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeColorProvider } from "@/components/providers/theme-color-provider";

export function DashboardThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeColorProvider>{children}</ThemeColorProvider>
    </ThemeProvider>
  );
}
