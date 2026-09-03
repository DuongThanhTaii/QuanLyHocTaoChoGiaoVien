"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/actions';
import { getUnreadChatCount } from '@/app/actions/chat-actions';
import { createBrowserClient } from '@supabase/ssr';
import { ElementType, ReactNode, useCallback, useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useThemeColor } from '../providers/theme-color-provider';
import {
  Users,
  Calendar,
  LogOut,
  MoreVertical,
  Menu,
  MoreHorizontal,
  ShieldCheck,
  ScrollText,
  Tags,
  BadgeDollarSign
} from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '../ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { NotificationDropdown } from './NotificationDropdown';
import { SupportButton } from '../shared/SupportButton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';

// Animated Icons
import { LayoutDashboardIcon } from '../ui/layout-dashboard-icon';
import { GraduationCapIcon } from '../ui/graduation-cap';
import { CalendarDaysIcon } from '../ui/calendar-days';
import { BookIcon } from '../ui/book-icon';
import { CreditCardIcon } from '../ui/credit-card';
import { MessageSquareMoreIcon } from '../ui/message-square-more';
import { ChartNoAxesColumnIncreasingIcon } from '../ui/chart-no-axes-column-increasing';
import { FoldersIcon } from '../ui/folders';

interface SidebarItem {
  icon: ElementType;
  label: string;
  href: string;
}

type AnimatedIconController = { startAnimation?: () => void; stopAnimation?: () => void };

function useSidebarIconAnimation() {
  const iconRef = useRef<AnimatedIconController | null>(null);
  const setIconRef = useCallback((node: unknown) => {
    iconRef.current = node && typeof node === 'object' ? node as AnimatedIconController : null;
  }, []);
  return { setIconRef, start: () => iconRef.current?.startAnimation?.(), stop: () => iconRef.current?.stopAnimation?.() };
}

const teacherNav: SidebarItem[] = [
  { icon: LayoutDashboardIcon, label: 'Bảng điều khiển', href: '/teacher' },
  { icon: GraduationCapIcon, label: 'Lớp học', href: '/teacher/classes' },
  { icon: CalendarDaysIcon, label: 'Thời khóa biểu', href: '/teacher/schedule' },
  { icon: BookIcon, label: 'Bài giảng & Bài tập', href: '/teacher/content' },
  { icon: CreditCardIcon, label: 'Hóa đơn học phí', href: '/teacher/invoices' },
  { icon: MessageSquareMoreIcon, label: 'Tin nhắn', href: '/teacher/chat' },
  { icon: ChartNoAxesColumnIncreasingIcon, label: 'Thống kê & Thuế', href: '/teacher/analytics' },
  { icon: FoldersIcon, label: 'Tiện ích & Biểu mẫu', href: '/teacher/tools' },
];

const parentNav: SidebarItem[] = [
  { icon: Users, label: 'Con của tôi', href: '/parent/students' },
  { icon: CreditCardIcon, label: 'Hóa đơn học phí', href: '/parent/invoices' },
  { icon: MessageSquareMoreIcon, label: 'Tin nhắn', href: '/parent/chat' },
];

const studentNav: SidebarItem[] = [
  { icon: GraduationCapIcon, label: 'Lớp học của tôi', href: '/student/classes' },
  { icon: CalendarDaysIcon, label: 'Thời khóa biểu', href: '/student/schedule' },
  { icon: CreditCardIcon, label: 'Học phí', href: '/student/invoices' },
  { icon: MessageSquareMoreIcon, label: 'Tin nhắn', href: '/student/chat' },
  { icon: Users, label: 'Yêu cầu liên kết', href: '/student/requests' },
];

const adminNav: SidebarItem[] = [
  { icon: LayoutDashboardIcon, label: 'Tổng quan', href: '/admin' },
  { icon: Users, label: 'Người dùng', href: '/admin/users' },
  { icon: ShieldCheck, label: 'Vai trò & quyền', href: '/admin/roles' },
  { icon: Tags, label: 'Gói & giá cước', href: '/admin/plans' },
  { icon: BadgeDollarSign, label: 'Subscription', href: '/admin/subscriptions' },
  { icon: ScrollText, label: 'Nhật ký hệ thống', href: '/admin/logs' },
];

function NavItem({ 
  item, 
  pathname, 
  isCollapsed,
  badge 
}: { 
  item: SidebarItem, 
  pathname: string, 
  isCollapsed: boolean,
  badge?: number 
}) {
  const iconAnimation = useSidebarIconAnimation();
  // Logic to determine active state
  const isActive = item.href === '/teacher' || item.href === '/parent' || item.href === '/student' 
    ? pathname === item.href 
    : pathname.startsWith(item.href);

  const hasBadge = typeof badge === 'number' && badge > 0;

  return (
    <Link
      href={item.href}
      title={isCollapsed ? `${item.label}${hasBadge ? ` ${badge}` : ''}` : undefined}
      onMouseEnter={iconAnimation.start}
      onMouseLeave={iconAnimation.stop}
      className={`relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-300 overflow-hidden group
        ${isActive 
          ? "text-primary bg-primary/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <item.icon
          ref={iconAnimation.setIconRef}
          size={20}
          strokeWidth={1.6}
          className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-primary drop-shadow-[0_0_5px_rgba(var(--color-primary),0.5)]" : "text-muted-foreground group-hover:text-foreground"}`}
        />
        {hasBadge && isCollapsed && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      
      <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden flex items-center justify-between flex-1 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
        <span className="z-10">{item.label}</span>
        {hasBadge && (
          <span className="z-10 font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shadow-2xs ml-1.5 min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </div>
      
      {/* Subtle hover/active gradient background */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none" />
      )}
    </Link>
  );
}

function isNavItemActive(item: SidebarItem, pathname: string) {
  return item.href === '/teacher' || item.href === '/parent' || item.href === '/student'
    ? pathname === item.href
    : pathname.startsWith(item.href);
}

function MobileNavItem({ item, pathname, badge }: { item: SidebarItem; pathname: string; badge?: number }) {
  const iconAnimation = useSidebarIconAnimation();
  const isActive = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      onMouseEnter={iconAnimation.start}
      onMouseLeave={iconAnimation.stop}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
    >
      <span className={`relative grid size-8 place-items-center rounded-lg ${isActive ? 'bg-primary/10' : ''}`}>
        <item.icon ref={iconAnimation.setIconRef} size={18} strokeWidth={1.6} className="size-[18px]" />
        {!!badge && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span className="max-w-16 truncate">{item.label}</span>
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const navItems = userRole === 'teacher' ? teacherNav : userRole === 'parent' ? parentNav : userRole === 'student' ? studentNav : userRole === 'admin' ? adminNav : [];
  const mobileNavItems = navItems.slice(0, 4);
  const pathname = usePathname();

  const { setTheme } = useTheme();
  const { setThemeColor } = useThemeColor();
  const isThemeColor = (value: string): value is 'zinc' | 'red' | 'blue' | 'green' | 'orange' => ['zinc', 'red', 'blue', 'green', 'orange'].includes(value);

  useEffect(() => {
    if (uiSettings && !sessionStorage.getItem('theme_synced')) {
      if (uiSettings.theme) setTheme(uiSettings.theme);
      if (uiSettings.themeColor && isThemeColor(uiSettings.themeColor)) setThemeColor(uiSettings.themeColor);
      sessionStorage.setItem('theme_synced', 'true');
    }
  }, [uiSettings, setTheme, setThemeColor]);

  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadChatCount();
      if (typeof res?.unreadCount === 'number') {
        setUnreadChatCount(res.unreadCount);
      }
    } catch (e) {
      console.error("Error fetching unread chat count:", e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleChatRead = () => {
      setUnreadChatCount((prev) => Math.max(0, prev - 1));
      fetchUnreadCount();
    };

    window.addEventListener('chat:read', handleChatRead);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('global-unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants' },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('chat:read', handleChatRead);
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log("Video auto-play prevented:", e));
    }
  }, [isCollapsed]);

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

  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const dateFormatted = now.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    setCurrentDateStr(`${dayName}, ${dateFormatted}`);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-dvh bg-background text-foreground overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className={`hidden bg-card border-r border-border lg:flex flex-col transition-all duration-300 z-10 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
          
          {/* Logo Section */}
          <div className={`h-16 flex items-center border-b border-border transition-all duration-300 pl-2 pr-2 overflow-hidden`}>
            <Tooltip>
              <TooltipTrigger 
                className="flex items-center cursor-pointer shrink-0 border-none outline-none bg-transparent"
                onClick={() => isCollapsed && setIsCollapsed(false)}
              >
                  <div className="w-14 h-14 flex items-center justify-center shrink-0 relative transition-transform duration-300">
                    {/* Floor shadow */}
                    <div className="absolute bottom-1 w-8 h-1.5 bg-black/30 rounded-[50%] blur-[2px] z-0 translate-y-1" />
                    
                    <video 
                      ref={videoRef}
                      src="/logo.webm" 
                      className="w-full h-full object-contain scale-110 relative z-10 pointer-events-none select-none"
                      muted 
                      playsInline
                      onContextMenu={(e) => e.preventDefault()}
                      controlsList="nodownload"
                    />
                    {/* Overlay to block extensions like IDM from attaching download buttons */}
                    <div className="absolute inset-0 z-20 bg-transparent cursor-pointer" onContextMenu={(e) => e.preventDefault()} />
                  </div>
                  <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-1'}`}>
                    <div className="text-foreground font-bold text-xl tracking-tight">
                      GiaSư<span className="font-light text-muted-foreground">Pro</span>
                    </div>
                  </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  Mở rộng bảng điều khiển
                </TooltipContent>
              )}
            </Tooltip>

          <button 
            onClick={() => setIsCollapsed(true)} 
            className={`ml-auto p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 shrink-0 ${isCollapsed ? 'w-0 opacity-0 p-0 overflow-hidden scale-0' : 'opacity-100 scale-100'}`}
            title="Thu gọn menu"
            tabIndex={isCollapsed ? -1 : 0}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, index) => (
            <NavItem 
              key={index} 
              item={item} 
              pathname={pathname} 
              isCollapsed={isCollapsed} 
              badge={item.label === 'Tin nhắn' ? unreadChatCount : undefined}
            />
          ))}
        </div>

        {/* Footer Section (Settings & Profile) */}
        <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm transition-all duration-300">
          
          <SupportButton isCollapsed={isCollapsed} />
          
          <DropdownMenu>
            <DropdownMenuTrigger className={`outline-none w-full flex items-center px-1.5 py-1.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 cursor-pointer text-left border border-transparent hover:border-border overflow-hidden`}>
              <UserAvatar name={userName} email={userEmail} size="md" className="shrink-0" />
              <div className={`flex items-center transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                <span className="flex flex-col flex-1 overflow-hidden leading-tight gap-0.5">
                  <span className="truncate font-medium text-foreground">{userName || 'Người dùng'}</span>
                  <span className="truncate text-xs text-muted-foreground font-normal">{userEmail || 'user@giasupro.vn'}</span>
                </span>
                <MoreVertical className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-64 bg-popover border-border">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Tài khoản của tôi</span>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                    userRole === 'teacher' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    userRole === 'student' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    userRole === 'parent' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    userRole === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {userRole === 'teacher' ? 'Giáo viên' : userRole === 'parent' ? 'Phụ huynh' : userRole === 'student' ? 'Học sinh' : userRole === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <Link href="/profile" className="cursor-pointer">
                  <DropdownMenuItem className="hover:bg-muted cursor-pointer">Hồ sơ cá nhân</DropdownMenuItem>
                </Link>
                <Link href="/settings" className="cursor-pointer">
                  <DropdownMenuItem className="hover:bg-muted cursor-pointer">Cài đặt hệ thống</DropdownMenuItem>
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              aria-label="Mở menu điều hướng"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">G</div>
              <span className="font-semibold tracking-tight">GiaSưPro</span>
            </div>
            <h2 className="text-foreground font-medium text-lg hidden sm:block">
              {greeting}, <span className="font-semibold text-primary">{displayName}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <NotificationDropdown />
            
            {currentDateStr && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{currentDateStr}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${mobileNavItems.length + 1}, minmax(0, 1fr))` }}>
        {mobileNavItems.map((item) => <MobileNavItem key={item.href} item={item} pathname={pathname} badge={item.label === 'Tin nhắn' ? unreadChatCount : undefined} />)}
        <Button 
          variant="ghost" 
          className="h-auto flex-col gap-1 rounded-xl px-2 py-2 text-[10px] font-medium text-muted-foreground" 
          aria-label="Mở toàn bộ menu"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="grid size-8 place-items-center rounded-lg"><MoreHorizontal className="size-[18px]" /></span>
          <span>Tất cả</span>
        </Button>
      </nav>

      {/* Mobile Drawer Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[min(20rem,86vw)] gap-0 p-0">
          <SheetHeader className="border-b px-5 py-5 pr-12">
            <SheetTitle className="flex items-center gap-2 text-lg"><span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">G</span>GiaSưPro</SheetTitle>
            <SheetDescription>Điều hướng tài khoản {userRole === 'teacher' ? 'giáo viên' : userRole === 'parent' ? 'phụ huynh' : userRole === 'student' ? 'học sinh' : 'quản trị viên'}.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${isNavItemActive(item, pathname) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
                {item.label === 'Tin nhắn' && unreadChatCount > 0 && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
              </Link>
            ))}
          </div>
          <div className="space-y-2 border-t p-3">
            <SupportButton isCollapsed={false} />
            <Link 
              href="/profile" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <UserAvatar name={userName} email={userEmail} size="sm" />
              <span className="truncate">Hồ sơ & cài đặt</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </TooltipProvider>
  );
}
