import { Suspense } from 'react';
import TeacherStats from './components/TeacherStats';
import TodaySchedule from './components/TodaySchedule';
import { StatsSkeleton } from '@/components/skeletons/StatsSkeleton';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';

export default function TeacherRoot() {
  return (
    <div className="space-y-6">
      <div data-tour-id="teacher-dashboard">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tổng quan</h1>
        <p className="text-zinc-500">Chào mừng bạn quay trở lại. Đây là lịch trình hôm nay của bạn.</p>
      </div>

      {/* Tải dữ liệu Thống kê song song và độc lập */}
      <Suspense fallback={<StatsSkeleton />}>
        <TeacherStats />
      </Suspense>

      {/* Tải dữ liệu Lịch dạy song song và độc lập */}
      <Suspense fallback={<ListSkeleton />}>
        <TodaySchedule />
      </Suspense>
    </div>
  );
}
