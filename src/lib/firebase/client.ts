'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function isConfigured() {
  return Object.values(firebaseConfig).every(Boolean) && Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

export async function subscribeToPushNotifications() {
  if (!isConfigured()) throw new Error('Thông báo chưa được cấu hình trên hệ thống.');
  if (!('Notification' in window) || !await isSupported()) throw new Error('Trình duyệt này chưa hỗ trợ thông báo push.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Bạn chưa cho phép nhận thông báo.');
  const registration = await navigator.serviceWorker.ready;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Không thể đăng ký thiết bị nhận thông báo.');
  const response = await fetch('/api/push/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
  if (!response.ok) throw new Error((await response.json()).error || 'Không thể lưu thiết bị nhận thông báo.');
}

export async function listenForForegroundMessages(callback: (payload: MessagePayload) => void) {
  if (!isConfigured() || !await isSupported()) return () => {};
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return onMessage(getMessaging(app), callback);
}
