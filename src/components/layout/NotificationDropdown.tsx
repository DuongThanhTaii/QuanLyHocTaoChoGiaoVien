'use client';

import { useState, useEffect } from 'react';
import { BellRing, CheckCircle2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  time: string;
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'Học phí mới được thanh toán',
    message: 'Hóa đơn HD-202609-2368 đã được thanh toán thành công.',
    isRead: false,
    time: '5 phút trước'
  },
  {
    id: '2',
    title: 'Nhắc nhở lịch học',
    message: 'Lớp Toán nâng cao sẽ bắt đầu sau 30 phút.',
    isRead: false,
    time: '1 giờ trước'
  }
];

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('giasupro_mock_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('giasupro_mock_notifications', JSON.stringify(notifications));
    }
  }, [notifications, mounted]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 mr-1">
          <BellRing className="w-5 h-5" />
          {unreadCount > 0 && mounted && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm border-2 border-white dark:border-zinc-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden mt-1">
        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
          <div className="font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-100 text-sm">
            Thông báo mới
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" /> Đã đọc
            </button>
          )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm flex flex-col items-center">
              <BellRing className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
              Bạn không có thông báo nào.
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group relative flex gap-3 cursor-pointer ${!n.isRead ? 'bg-blue-50/10 dark:bg-blue-900/10' : ''}`}
                onClick={() => markAsRead(n.id)}
              >
                {!n.isRead ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-sm" />
                ) : (
                  <div className="w-2 h-2 shrink-0" />
                )}
                
                <div className="flex-1 min-w-0 pr-6 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm truncate pr-2 ${!n.isRead ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {n.time}
                  </p>
                </div>

                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
