import Link from 'next/link';
import { logout } from '@/app/(auth)/actions';
import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '../ui/dropdown-menu';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from '../app-sidebar';

export default function DashboardLayout({ children, userRole = 'teacher', userName = '' }: { children: ReactNode, userRole?: string, userName?: string }) {
  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} userName={userName} />
      <SidebarInset>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="w-px h-4 bg-zinc-200" />
            <h2 className="text-zinc-800 font-medium text-lg hidden sm:block">
              Chào {userName ? `${userName} ` : ''}trở lại
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-9 w-9 border border-zinc-200 cursor-pointer">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>GV</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                    <button type="submit" className="w-full">
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
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
