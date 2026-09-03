"use client";

import { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const DISMISS_KEY = 'mari-pwa-install-dismissed-at';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function PwaManager() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    const updateNetwork = () => setOffline(!navigator.onLine);
    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const canAskAgain = !dismissedAt || Date.now() - dismissedAt > DISMISS_FOR_MS;
    const timer = window.setTimeout(() => {
      if (!canAskAgain || isStandalone()) return;
      if (isIos()) setShowIosHint(true);
      else setShowInstall(true);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowInstall(false);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setShowInstall(false);
  };

  return <>
    {offline && <div className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-lg"><WifiOff className="size-3.5" />Đang ngoại tuyến</div>}
    {(showInstall || showIosHint) && <div className="fixed inset-x-3 bottom-20 z-[90] mx-auto flex max-w-md items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-xl sm:bottom-5 sm:right-5 sm:left-auto"><img src="/images/empty_states/logo.png" alt="" className="size-10 shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Cài đặt Mari</p><p className="mt-1 text-xs text-muted-foreground">{showIosHint ? 'Nhấn Chia sẻ rồi chọn Thêm vào Màn hình chính.' : 'Mở Mari nhanh hơn từ màn hình chính của bạn.'}</p>{showInstall && <button type="button" onClick={install} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"><Download className="size-3.5" />Cài đặt</button>}</div><button type="button" onClick={dismiss} aria-label="Đóng" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button></div>}
  </>;
}
