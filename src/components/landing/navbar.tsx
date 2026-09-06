"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/config/landing-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { logout } from "@/app/(auth)/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowRight,
  Menu,
  X,
  Zap,
  ChevronDown,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { MaxWidthWrapper } from "@/components/global/max-width-wrapper";
import Image from "next/image";

export interface LoggedInUser {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  dashboardUrl: string;
}

interface NavbarProps {
  user?: LoggedInUser | null;
}

const ROLE_LABELS: Record<string, string> = {
  teacher: "Giáo viên",
  student: "Học sinh",
  parent: "Phụ huynh",
  admin: "Quản trị viên",
};

function LandingAccountMenu({ user, compact = false }: { user: LoggedInUser; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
          compact
            ? "rounded-full border border-orange-300 p-1 hover:border-orange-400 hover:bg-orange-50"
            : "flex items-center gap-2 rounded-full text-left group cursor-pointer",
        )}
        aria-label="Mở menu tài khoản"
      >
        <UserAvatar name={user.name} email={user.email} size="sm" />
        {!compact && (
          <div className="hidden min-w-0 flex-col text-left sm:flex">
            <span className="max-w-[120px] truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white">
              {user.name}
            </span>
            <span className="-mt-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 border-orange-100 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="mt-0.5 truncate text-xs font-normal text-slate-500 dark:text-zinc-400">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={user.dashboardUrl} className="block">
          <DropdownMenuItem className="cursor-pointer gap-2.5 px-2.5 py-2 font-medium">
            <LayoutDashboard className="size-4 text-orange-600" />
            Vào dashboard
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <form action={logout}>
          <button type="submit" className="block w-full text-left">
            <DropdownMenuItem variant="destructive" className="w-full cursor-pointer gap-2.5 px-2.5 py-2 font-medium">
              <LogOut className="size-4" />
              Đăng xuất
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const Navbar = ({ user }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 h-16 z-50 transition-all duration-300 select-none",
        scrolled
          ? "bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-orange-100/80 dark:border-zinc-800 shadow-xs"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <MaxWidthWrapper className="flex items-center justify-between h-full">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm shadow-orange-500/10 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Image
              src="/images/empty_states/logo.png"
              alt="Mari Logo"
              width={36}
              height={36}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              <span className="text-orange-500">Mari</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 -mt-1 hidden sm:block">
              Quản lý học tập 4.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            if (link.menu) {
              return (
                <div
                  key={link.title}
                  className="relative"
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <span>{link.title}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* Mega Dropdown */}
                  {featuresOpen && (
                    <div className="absolute top-full left-0 w-80 p-2.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl shadow-orange-500/5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="space-y-1">
                        {link.menu.map((subItem) => (
                          <Link
                            key={subItem.title}
                            href={subItem.href}
                            onClick={() => setFeaturesOpen(false)}
                            className="block p-2.5 rounded-xl hover:bg-orange-50/80 dark:hover:bg-zinc-800/80 transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                              {subItem.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {subItem.description}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.title}
                href={link.href!}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {link.title}
              </Link>
            );
          })}
        </nav>

        {/* Auth Action Area */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            /* User already logged in */
            <div className="flex items-center gap-3 bg-orange-50/80 dark:bg-zinc-900/90 pl-3 pr-1.5 py-1 rounded-full border border-orange-200/70 dark:border-zinc-800 shadow-2xs">
              <LandingAccountMenu user={user} />

              <Link
                href={user.dashboardUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-sm hover:shadow-md hover:from-orange-600 hover:to-amber-600 transition-all active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Vào Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            /* Guest / Not logged in */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="relative inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              >
                <span>Dùng thử miễn phí</span>
                <Zap className="w-3.5 h-3.5 fill-current" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <LandingAccountMenu user={user} compact />
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </MaxWidthWrapper>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-4 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 dark:text-zinc-200 hover:bg-orange-50 rounded-lg"
            >
              Tính năng nổi bật
            </Link>
            <Link
              href="#process"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 dark:text-zinc-200 hover:bg-orange-50 rounded-lg"
            >
              Quy trình hoạt động
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 dark:text-zinc-200 hover:bg-orange-50 rounded-lg"
            >
              Bảng giá dịch vụ
            </Link>
            <Link
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 dark:text-zinc-200 hover:bg-orange-50 rounded-lg"
            >
              Đánh giá từ giáo viên
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-base font-medium text-slate-700 dark:text-zinc-200 hover:bg-orange-50 rounded-lg"
            >
              Câu hỏi thường gặp
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-2.5">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 p-2 bg-orange-50 dark:bg-zinc-900 rounded-xl">
                  <UserAvatar name={user.name} email={user.email} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-orange-600">
                      {ROLE_LABELS[user.role] || user.role}
                    </p>
                  </div>
                </div>
                <Link
                  href={user.dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm shadow-md"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>
                    Vào Dashboard ({ROLE_LABELS[user.role] || user.role})
                  </span>
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </form>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 font-semibold text-sm text-slate-700 dark:text-zinc-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-md"
                >
                  Đăng ký miễn phí ngay
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
