"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/actions';
import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColor } from '../providers/theme-color-provider';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
  FolderOpen,
  MoreVertical,
  Menu
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '../ui/dropdown-menu';

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
}

const teacherNav: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', href: '/teacher' },
  { icon: Users, label: 'Lớp học', href: '/teacher/classes' },
  { icon: Calendar, label: 'Thời khóa biểu', href: '/teacher/schedule' },
  { icon: BookOpen, label: 'Bài giảng & Bài tập', href: '/teacher/content' },
  { icon: CreditCard, label: 'Hóa đơn học phí', href: '/teacher/invoices' },
  { icon: MessageSquare, label: 'Tin nhắn', href: '/teacher/chat' },
  { icon: BarChart, label: 'Thống kê & Thuế', href: '/teacher/analytics' },
  { icon: FolderOpen, label: 'Tiện ích & Biểu mẫu', href: '/teacher/tools' },
];

const parentNav: SidebarItem[] = [
  { icon: Users, label: 'Con của tôi', href: '/parent/students' },
  { icon: CreditCard, label: 'Hóa đơn học phí', href: '/parent/invoices' },
];

const studentNav: SidebarItem[] = [
  { icon: BookOpen, label: 'Lớp học của tôi', href: '/student/classes' },
  { icon: Calendar, label: 'Thời khóa biểu', href: '/student/schedule' },
  { icon: CreditCard, label: 'Học phí', href: '/student/invoices' },
  { icon: Users, label: 'Yêu cầu liên kết', href: '/student/requests' },
];

function NavItem({ item, pathname, isCollapsed }: { item: SidebarItem, pathname: string, isCollapsed: boolean }) {
  // Logic to determine active state
  const isActive = item.href === '/teacher' || item.href === '/parent' || item.href === '/student' 
    ? pathname === item.href 
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.label : undefined}
      className={`relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-300 overflow-hidden group
        ${isActive 
          ? "text-primary bg-primary/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
    >
      <item.icon className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isActive ? "text-primary drop-shadow-[0_0_5px_rgba(var(--color-primary),0.5)]" : "text-muted-foreground group-hover:text-foreground"}`} />
      
      <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex items-center ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
        <span className="z-10">{item.label}</span>
      </div>
      
      {/* Subtle hover/active gradient background */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none" />
      )}
    </Link>
  );
}

export default function DashboardLayout({ 
  children, 
  userRole = 'teacher', 
  userName = '', 
  userEmail = '',
  uiSettings 
}: { 
  children: ReactNode, 
  userRole?: string, 
  userName?: string, 
  userEmail?: string,
  uiSettings?: { theme?: string; themeColor?: string }
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = userRole === 'teacher' ? teacherNav : userRole === 'parent' ? parentNav : userRole === 'student' ? studentNav : [];
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith('/settings');

  const { setTheme } = useTheme();
  const { setThemeColor } = useThemeColor();

  useEffect(() => {
    if (uiSettings && !sessionStorage.getItem('theme_synced')) {
      if (uiSettings.theme) setTheme(uiSettings.theme);
      if (uiSettings.themeColor) setThemeColor(uiSettings.themeColor as any);
      sessionStorage.setItem('theme_synced', 'true');
    }
  }, [uiSettings, setTheme, setThemeColor]);

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 14) return 'Chào buổi trưa';
    if (hour >= 14 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };
  const greeting = getGreeting();
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'bạn');

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-card border-r border-border flex flex-col transition-all duration-300 z-10 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
        
        {/* Logo Section */}
        <div className={`h-16 flex items-center border-b border-border transition-all duration-300 ${isCollapsed ? 'px-4' : 'px-6'} overflow-hidden`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
              G
            </div>
            <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-0'}`}>
              <div className="text-foreground font-bold text-xl tracking-tight">
                GiaSư<span className="font-light text-muted-foreground">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, index) => (
            <NavItem key={index} item={item} pathname={pathname} isCollapsed={isCollapsed} />
          ))}
        </div>

        {/* Footer Section (Settings & Profile) */}
        <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm transition-all duration-300">
          <Link 
            href="/settings" 
            title={isCollapsed ? 'Cài đặt' : undefined}
            className={`relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-300 overflow-hidden group mb-2
              ${isSettingsActive 
                ? "text-primary bg-primary/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }
            `}
          >
            <Settings className={`w-5 h-5 shrink-0 transition-colors duration-300 ${isSettingsActive ? "text-primary drop-shadow-[0_0_5px_rgba(var(--color-primary),0.5)]" : "text-muted-foreground group-hover:text-foreground"}`} />
            
            <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex items-center ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
              <span className="z-10">Cài đặt</span>
            </div>
            
            {isSettingsActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none" />
            )}
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className={`outline-none w-full flex items-center px-1.5 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 cursor-pointer text-left border border-transparent hover:border-border overflow-hidden`}>
              <Avatar className="h-9 w-9 border border-border shrink-0 transition-all duration-300">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">GV</AvatarFallback>
              </Avatar>
              <div className={`flex items-center transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                <span className="flex flex-col flex-1 overflow-hidden leading-tight gap-0.5">
                  <span className="truncate font-medium text-foreground">{userName || 'Người dùng'}</span>
                  <span className="truncate text-[10px] uppercase tracking-wider text-primary font-semibold">
                    {userRole === 'teacher' ? 'Giáo viên' : userRole === 'parent' ? 'Phụ huynh' : userRole === 'student' ? 'Học sinh' : 'Thành viên'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground font-normal">{userEmail || 'user@giasupro.vn'}</span>
                </span>
                <MoreVertical className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-56 bg-popover border-border">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <Link href="/profile" className="cursor-pointer">
                  <DropdownMenuItem className="hover:bg-muted cursor-pointer">Hồ sơ cá nhân</DropdownMenuItem>
                </Link>
                <Link href="/pricing" className="cursor-pointer">
                  <DropdownMenuItem className="hover:bg-muted cursor-pointer">Gói đăng ký (Pro)</DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuGroup>
                <form action={logout}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="text-destructive hover:bg-destructive/10 cursor-pointer w-full focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top Header */}
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors hidden sm:block"
              title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-foreground font-medium text-lg hidden sm:block">
              {greeting}, <span className="font-semibold text-primary">{displayName}</span>
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
