"use client";

import { useTheme } from "next-themes";
import { useThemeColor, type ThemeColor } from "@/components/providers/theme-color-provider";
import { Bell, Camera, CheckCircle2, Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { saveUiSettings } from "./actions";
import { subscribeToPushNotifications } from "@/lib/firebase/client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();
  const [mounted, setMounted] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [cameraGranted, setCameraGranted] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if ('Notification' in window) setNotificationPermission(Notification.permission);
    if (navigator.permissions?.query) {
      void navigator.permissions.query({ name: 'camera' as PermissionName }).then((permission) => {
        setCameraGranted(permission.state === 'granted');
        permission.addEventListener('change', () => setCameraGranted(permission.state === 'granted'));
      }).catch(() => {});
    }
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    saveUiSettings(newTheme, undefined).catch(console.error);
  };

  const handleSetColor = (newColor: ThemeColor) => {
    setThemeColor(newColor);
    saveUiSettings(undefined, newColor).catch(console.error);
  };

  const enableNotifications = async () => {
    try {
      await subscribeToPushNotifications();
      setNotificationPermission('granted');
      toast.success('Đã bật thông báo cho thiết bị này.');
    } catch (error) {
      setNotificationPermission('Notification' in window ? Notification.permission : 'unsupported');
      toast.error(error instanceof Error ? error.message : 'Không thể bật thông báo.');
    }
  };

  const enableCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt này không hỗ trợ truy cập camera.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraGranted(true);
      toast.success('Đã cho phép Mari sử dụng camera trên thiết bị này.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bạn chưa cho phép sử dụng camera.');
    }
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
    <div className="max-w-4xl space-y-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/teacher">Trang chủ</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Cài đặt hệ thống</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Cài đặt hệ thống</h1>
      </div>

      <div className="grid gap-8 rounded-xl border border-border bg-card p-6">
        
        {/* Theme Mode Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Chế độ hiển thị</h2>
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
          <h2 className="text-lg font-medium text-foreground">Màu sắc chủ đạo</h2>
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
                onClick={() => handleSetColor(color.id as ThemeColor)}
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

        <div className="h-px w-full bg-border" />

        <section className="space-y-4" aria-labelledby="permission-settings-heading">
          <div><h2 id="permission-settings-heading" className="text-lg font-medium text-foreground">Quyền sử dụng</h2><p className="mt-1 text-sm text-muted-foreground">Cấp quyền trên thiết bị này khi bạn cần dùng từng tính năng.</p></div>
          <div className="divide-y rounded-lg border border-border">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bell className="size-4" /></span><div><p className="font-medium text-foreground">Thông báo</p><p className="mt-0.5 text-sm text-muted-foreground">Nhận nhắc lịch học, điểm danh và bài tập.</p></div></div>{notificationPermission === 'granted' ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" />Đã cho phép</span> : <button type="button" onClick={enableNotifications} className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Cho phép</button>}</div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Camera className="size-4" /></span><div><p className="font-medium text-foreground">Camera</p><p className="mt-0.5 text-sm text-muted-foreground">Dùng khi quét mã QR và các tính năng cần camera.</p></div></div>{cameraGranted ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" />Đã cho phép</span> : <button type="button" onClick={enableCamera} className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Cho phép</button>}</div>
          </div>
        </section>

        <div className="h-px w-full bg-border" />

        <section className="space-y-4" aria-labelledby="app-settings-heading">
          <div><h2 id="app-settings-heading" className="text-lg font-medium text-foreground">Cài đặt ứng dụng</h2><p className="mt-1 text-sm text-muted-foreground">Trạng thái Mari trên thiết bị hiện tại.</p></div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Smartphone className="size-4" /></span><div><p className="font-medium text-foreground">Ứng dụng Mari</p><p className="mt-0.5 text-sm text-muted-foreground">{isInstalled ? 'Mari đang mở dưới dạng ứng dụng đã cài đặt.' : 'Bạn đang dùng Mari trên trình duyệt. Có thể cài Mari từ biểu tượng cài đặt trên thanh địa chỉ.'}</p></div></div>
        </section>

      </div>
    </div>
  );
}
