"use client";

import { useTheme } from "next-themes";
import { useThemeColor } from "@/components/providers/theme-color-provider";
import { Moon, Sun, Monitor, CreditCard } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { saveUiSettings } from "./actions";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    saveUiSettings(newTheme, undefined).catch(console.error);
  };

  const handleSetColor = (newColor: any) => {
    setThemeColor(newColor);
    saveUiSettings(undefined, newColor).catch(console.error);
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý tùy chọn giao diện và hệ thống.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt Giao diện</h1>
        <p className="text-muted-foreground">Tùy chỉnh chế độ hiển thị và màu sắc chủ đạo của ứng dụng.</p>
      </div>

      <Link href="/settings/billing" className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50">
        <span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><CreditCard className="size-5" /></span><span><span className="block font-semibold text-foreground">Gói & thanh toán</span><span className="mt-0.5 block text-sm text-muted-foreground">Quản lý gia hạn tự động và phương thức thanh toán.</span></span></span><span className="text-sm font-medium text-primary">Quản lý</span>
      </Link>

      <div className="grid gap-8 border border-border bg-card rounded-xl p-6">
        
        {/* Theme Mode Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Chế độ hiển thị (Theme)</h3>
          <div role="group" aria-label="Chế độ hiển thị" className="grid grid-cols-3 rounded-xl border border-border bg-muted/50 p-1">
            <button
              onClick={() => handleSetTheme('light')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${theme === 'light' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sun className="size-4" /> Sáng
            </button>

            <button
              onClick={() => handleSetTheme('dark')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${theme === 'dark' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Moon className="size-4" /> Tối
            </button>

            <button
              onClick={() => handleSetTheme('system')}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${theme === 'system' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Monitor className="size-4" /> Hệ thống
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        {/* Theme Color Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Màu sắc chủ đạo</h3>
          <p className="text-sm text-muted-foreground">Chọn màu sắc nhấn cho các nút bấm và thành phần UI.</p>
          <div className="flex flex-wrap gap-4 mt-2">
            {[
              { id: 'orange', name: 'Cam (Mặc định)', class: 'bg-orange-500' },
              { id: 'zinc', name: 'Kẽm', class: 'bg-zinc-900 dark:bg-zinc-100' },
              { id: 'red', name: 'Đỏ', class: 'bg-red-600' },
              { id: 'blue', name: 'Xanh dương', class: 'bg-blue-600' },
              { id: 'green', name: 'Xanh lá', class: 'bg-emerald-600' },
            ].map((color) => (
              <button
                key={color.id}
                onClick={() => handleSetColor(color.id as any)}
                className="group flex items-center gap-3 p-2 transition-all hover:opacity-80"
              >
                <div className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center ${color.class}`}>
                  {themeColor === color.id && (
                    <div className="w-3 h-3 bg-white rounded-full mix-blend-difference" />
                  )}
                </div>
                <span className={`text-sm font-medium ${themeColor === color.id ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
