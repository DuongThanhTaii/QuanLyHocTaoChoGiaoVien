'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/infrastructure/auth/supabase/client';
import { listenForForegroundMessages, subscribeToPushNotifications } from '@/lib/firebase/client';

export function PushNotificationManager() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    void createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user || !('Notification' in window)) return;
      void listenForForegroundMessages((payload) => toast(payload.notification?.title || 'Thông báo mới', { description: payload.notification?.body })).then((stop) => { unsubscribe = stop; });
      if (Notification.permission === 'default') setVisible(true);
    });
    return () => unsubscribe();
  }, []);

  const enable = async () => {
    try { await subscribeToPushNotifications(); toast.success('Đã bật thông báo cho thiết bị này.'); setVisible(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể bật thông báo.'); }
  };

  if (!visible) return null;
  return <div className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-xl border bg-card p-4 shadow-xl sm:right-5 sm:left-auto"><Bell className="mt-0.5 size-5 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Bật thông báo?</p><p className="mt-1 text-xs text-muted-foreground">Nhận nhắc lịch học, điểm danh và bài tập ngay cả khi Mari đang đóng.</p><button type="button" onClick={enable} className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Bật thông báo</button></div><button type="button" onClick={() => setVisible(false)} aria-label="Đóng" className="p-1 text-muted-foreground"><X className="size-4" /></button></div>;
}
