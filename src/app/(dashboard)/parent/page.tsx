import { SetupChecklist } from '@/components/dashboard/SetupChecklist';

export default function ParentDashboardRoot() {
  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_440px]"><div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tổng quan</h1><p className="mt-1 text-zinc-500">Hoàn thiện thông tin để theo dõi việc học của con dễ dàng hơn.</p></div><SetupChecklist role="parent" /></div>;
}
