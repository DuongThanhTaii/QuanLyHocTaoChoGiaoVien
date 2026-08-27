'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ClassTabs({ classId }: { classId: string }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Tổng quan', href: `/teacher/classes/${classId}` },
    { name: 'Học sinh', href: `/teacher/classes/${classId}/students` },
    { name: 'Lịch học', href: `/teacher/classes/${classId}/schedule` },
    { name: 'Điểm danh', href: `/teacher/classes/${classId}/attendance` },
    { name: 'Bài giảng', href: `/teacher/classes/${classId}/lessons` },
    { name: 'Cài đặt', href: `/teacher/classes/${classId}/settings` },
  ];

  return (
    <div className="border-b border-zinc-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                isActive 
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors'
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
