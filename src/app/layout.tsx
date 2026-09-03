import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeColorProvider } from "@/components/providers/theme-color-provider";

const montserrat = Montserrat({
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { InitialCatLoader } from "@/components/shared/InitialCatLoader";

export const metadata: Metadata = {
  title: "Gia Sư Pro",
  description: "Hệ thống quản lý gia sư",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeColorProvider>
            <TooltipProvider>
              <InitialCatLoader />
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
