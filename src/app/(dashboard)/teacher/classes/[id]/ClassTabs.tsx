'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Users, TrendingUp } from 'lucide-react';

export function ClassTabs({ classId }: { classId: string }) {
  const pathname = usePathname();

  const isStudentsActive = pathname.startsWith(`/teacher/classes/${classId}/students`);

  const tabs = [
    { name: 'Tổng quan', href: `/teacher/classes/${classId}` },
    { 
      name: 'Học sinh', 
      href: `/teacher/classes/${classId}/students`,
      isDropdown: true,
      subItems: [
        { name: 'Danh sách lớp (Hồ sơ)', href: `/teacher/classes/${classId}/students` },
        { name: 'Tiến độ & Tổng hợp 360°', href: `/teacher/classes/${classId}/students?view=progress` }
      ]
    },
    { name: 'Lịch học', href: `/teacher/classes/${classId}/schedule` },
    { name: 'Điểm danh', href: `/teacher/classes/${classId}/attendance` },
    { name: 'Đánh giá', href: `/teacher/classes/${classId}/evaluations` },
    { name: 'Bài giảng', href: `/teacher/classes/${classId}/lessons` },
    { name: 'Cài đặt', href: `/teacher/classes/${classId}/settings` },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="-mb-px flex space-x-6 sm:space-x-8 items-center" aria-label="Tabs">
        {tabs.map((tab) => {
          if (tab.isDropdown) {
            return (
              <div key={tab.name} className="relative inline-flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          isStudentsActive
                            ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                            : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200',
                          'inline-flex items-center gap-1 whitespace-nowrap py-4 px-1 border-b-2 text-sm transition-colors outline-none cursor-pointer'
                        )}
                      />
                    }
                  >
                    <span>{tab.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1">
                    <DropdownMenuItem
                      render={
                        <Link
                          href={`/teacher/classes/${classId}/students`}
                          className="flex items-center gap-2 cursor-pointer text-xs py-2"
                        />
                      }
                    >
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Danh sách lớp (Hồ sơ)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <Link
                          href={`/teacher/classes/${classId}/students?view=progress`}
                          className="flex items-center gap-2 cursor-pointer text-xs py-2"
                        />
                      }
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span>Tiến độ & Tổng hợp 360°</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          }

          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive 
                  ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200',
                'whitespace-nowrap py-4 px-1 border-b-2 text-sm transition-colors'
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
