import { Suspense } from 'react';
import TeacherStats from './components/TeacherStats';
import TodaySchedule from './components/TodaySchedule';
import { StatsSkeleton } from '@/components/skeletons/StatsSkeleton';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { SetupChecklist } from '@/components/dashboard/SetupChecklist';

export default function TeacherRoot() {
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div data-tour-id="teacher-dashboard">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
            <p className="text-muted-foreground">Chào mừng bạn quay trở lại. Đây là lịch trình hôm nay của bạn.</p>
          </div>
          <Suspense fallback={<StatsSkeleton />}>
            <TeacherStats />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <SetupChecklist role="teacher" />
        </Suspense>
      </div>

      {/* Tải dữ liệu Lịch dạy song song và độc lập */}
      <Suspense fallback={<ListSkeleton />}>
        <TodaySchedule />
      </Suspense>
    </div>
  );
}
