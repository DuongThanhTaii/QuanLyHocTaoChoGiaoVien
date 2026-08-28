"use client";

import { useTheme } from "next-themes";
import { useThemeColor } from "@/components/providers/theme-color-provider";
import { Moon, Sun, Monitor } from "lucide-react";
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

      <div className="grid gap-8 border border-border bg-card rounded-xl p-6">
        
        {/* Theme Mode Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Chế độ hiển thị (Theme)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleSetTheme('light')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-background'}`}
            >
              <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-medium ${theme === 'light' ? 'text-primary' : 'text-foreground'}`}>Sáng</p>
                <p className="text-xs text-muted-foreground mt-0.5">Màu nền trắng</p>
              </div>
            </button>

            <button
              onClick={() => handleSetTheme('dark')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-background'}`}
            >
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-medium ${theme === 'dark' ? 'text-primary' : 'text-foreground'}`}>Tối</p>
                <p className="text-xs text-muted-foreground mt-0.5">Bảo vệ mắt ban đêm</p>
              </div>
            </button>

            <button
              onClick={() => handleSetTheme('system')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-background'}`}
            >
              <div className={`p-2 rounded-lg ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Monitor className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`font-medium ${theme === 'system' ? 'text-primary' : 'text-foreground'}`}>Hệ thống</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tự động theo OS</p>
              </div>
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
              { id: 'zinc', name: 'Kẽm (Mặc định)', class: 'bg-zinc-900 dark:bg-zinc-100' },
              { id: 'red', name: 'Đỏ', class: 'bg-red-600' },
              { id: 'blue', name: 'Xanh dương', class: 'bg-blue-600' },
              { id: 'green', name: 'Xanh lá', class: 'bg-emerald-600' },
              { id: 'orange', name: 'Cam', class: 'bg-orange-500' },
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
