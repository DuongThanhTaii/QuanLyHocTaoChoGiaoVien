import type { Metadata, Viewport } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaManager } from "@/components/providers/PwaManager";
import { PushNotificationManager } from "@/components/providers/PushNotificationManager";

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
  title: "Mari",
  description: "Hệ thống quản lý gia sư",
  applicationName: "Mari",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mari",
  },
  icons: {
    icon: "/images/empty_states/logo.png",
    apple: "/images/empty_states/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#171717",
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
        <TooltipProvider>
          <InitialCatLoader />
          <PwaManager />
          <PushNotificationManager />
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
