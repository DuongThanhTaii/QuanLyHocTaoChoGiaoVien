import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';
import { ReactNode } from 'react';
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
  CircleUserRound
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
  { icon: FolderOpen, label: 'Công cụ (Word)', href: '/teacher/tools/word' },
];

const parentNav: SidebarItem[] = [
  { icon: Users, label: 'Con của tôi', href: '/parent/students' },
  { icon: CreditCard, label: 'Hóa đơn học phí', href: '/parent/invoices' },
];

const studentNav: SidebarItem[] = [
  { icon: BookOpen, label: 'Lớp học của tôi', href: '/student/classes' },
  { icon: Calendar, label: 'Thời khóa biểu', href: '/student/schedule' },
];

export default function DashboardLayout({ children, userRole = 'teacher', userName = '', userEmail = '' }: { children: ReactNode, userRole?: string, userName?: string, userEmail?: string }) {
  const navItems = userRole === 'teacher' ? teacherNav : userRole === 'parent' ? parentNav : userRole === 'student' ? studentNav : [];

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-zinc-100">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              G
            </div>
            GiaSư<span className="font-light">Pro</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <item.icon className="w-5 h-5 text-zinc-500" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-200">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors mb-2">
            <Settings className="w-5 h-5 text-zinc-500" />
            Cài đặt
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none w-full flex items-center gap-3 px-1 py-1.5 text-sm font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer text-left">
              <Avatar className="h-9 w-9 border border-zinc-200 shrink-0">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>GV</AvatarFallback>
              </Avatar>
              <span className="flex flex-col flex-1 overflow-hidden leading-tight">
                <span className="truncate font-medium text-zinc-900">{userName || 'Người dùng'}</span>
                <span className="truncate text-xs text-zinc-500 font-normal">{userEmail || 'user@giasupro.vn'}</span>
              </span>
              <MoreVertical className="w-4 h-4 text-zinc-400 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile" className="cursor-pointer">
                  <DropdownMenuItem>Hồ sơ cá nhân</DropdownMenuItem>
                </Link>
                <Link href="/pricing" className="cursor-pointer">
                  <DropdownMenuItem>Gói đăng ký (Pro)</DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <form action={logout}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="text-red-600 cursor-pointer w-full">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-zinc-800 font-medium text-lg hidden sm:block">
              Chào {userName ? `${userName} ` : ''}trở lại
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
