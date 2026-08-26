"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, BookOpen, Calendar, CreditCard, MessageSquare, BarChart, Settings, FolderOpen } from "lucide-react"

const navSecondary = [
  {
    title: "Cài đặt",
    url: "/settings",
    icon: <Settings />,
  }
];

export function AppSidebar({ userRole = 'teacher', userName = '', userEmail = '', ...props }: React.ComponentProps<typeof Sidebar> & { userRole?: string, userName?: string, userEmail?: string }) {
  const pathname = usePathname();
  
  const teacherNav = [
    { title: "Bảng điều khiển", url: "/teacher", icon: <LayoutDashboard /> },
    { title: "Lớp học", url: "/teacher/classes", icon: <Users /> },
    { title: "Thời khóa biểu", url: "/teacher/schedule", icon: <Calendar /> },
    { title: "Bài giảng & Bài tập", url: "/teacher/content", icon: <BookOpen /> },
    { title: "Hóa đơn học phí", url: "/teacher/invoices", icon: <CreditCard /> },
    { title: "Tin nhắn", url: "/teacher/chat", icon: <MessageSquare /> },
    { title: "Thống kê & Thuế", url: "/teacher/analytics", icon: <BarChart /> },
    { title: "Công cụ (Word)", url: "/teacher/tools/word", icon: <FolderOpen /> },
  ];

  const parentNav = [
    { title: "Con của tôi", url: "/parent/students", icon: <Users /> },
    { title: "Hóa đơn học phí", url: "/parent/invoices", icon: <CreditCard /> },
  ];

  const navItems = userRole === 'teacher' ? teacherNav : userRole === 'parent' ? parentNav : [];

  // Add isActive based on current path
  const activeNavItems = navItems.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + '/')
  }));

  const user = {
    name: userName || "Người dùng",
    email: userEmail || "user@giasupro.vn",
    avatar: "https://github.com/shadcn.png", // Demo avatar
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-sidebar-primary-foreground">
                  <span className="text-white font-bold text-lg leading-none">G</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-base">GiaSư<span className="font-light">Pro</span></span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={activeNavItems} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
