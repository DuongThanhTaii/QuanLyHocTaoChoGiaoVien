import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const script = Object.values(config).every(Boolean) ? `
    importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');
    firebase.initializeApp(${JSON.stringify(config)});
    firebase.messaging().onBackgroundMessage(function(payload) {
      var notification = payload.notification || {};
      self.registration.showNotification(notification.title || 'Mari', {
        body: notification.body || 'Bạn có thông báo mới.',
        icon: '/icons/icon-192.png',
        data: payload.data || {},
      });
    });
  ` : '';
  return new NextResponse(script, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
}
