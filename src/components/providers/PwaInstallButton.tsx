'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      toast.success('Mari đã được cài đặt trên thiết bị này.');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (installed) return;
    if (ios) {
      toast('Cài đặt Mari trên iPhone/iPad', { description: 'Nhấn Chia sẻ, sau đó chọn “Thêm vào Màn hình chính”.' });
      return;
    }
    if (!installEvent) {
      toast('Chưa thể hiển thị cửa sổ cài đặt', { description: 'Hãy mở Mari bằng Chrome hoặc Edge và thử lại sau vài giây.' });
      return;
    }
    setInstalling(true);
    try {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === 'dismissed') toast('Bạn chưa cài Mari');
    } finally {
      setInstalling(false);
    }
  };

  if (installed) {
    return <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4" />Đã cài đặt</span>;
  }

  return <button type="button" onClick={install} disabled={installing} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60">{ios ? <Share className="size-4" /> : <Download className="size-4" />}{installing ? 'Đang mở…' : 'Cài đặt Mari'}</button>;
}

export function PwaInstallStatus() {
  return <div className="flex items-start gap-3 rounded-lg border border-border p-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Smartphone className="size-4" /></span><div className="min-w-0 flex-1"><p className="font-medium text-foreground">Ứng dụng Mari</p><p className="mt-0.5 text-sm text-muted-foreground">Cài Mari để mở nhanh như một ứng dụng độc lập trên Android hoặc máy tính.</p></div><PwaInstallButton /></div>;
}
