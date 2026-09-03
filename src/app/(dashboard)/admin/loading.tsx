import { Skeleton } from '@/components/ui/skeleton';

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`rounded-xl border bg-card p-5 ${className}`}><Skeleton className="h-4 w-32" /><Skeleton className="mt-4 h-8 w-24" /><Skeleton className="mt-3 h-3 w-full" /></div>;
}

export default function AdminLoading() {
  return (
    <div className="space-y-7" aria-label="Đang tải trang quản trị">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><Skeleton className="h-8 w-64" /><Skeleton className="mt-3 h-4 w-80 max-w-full" /></div><Skeleton className="h-10 w-40" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      <div className="grid gap-5 lg:grid-cols-5"><div className="rounded-xl border bg-card p-5 lg:col-span-3"><Skeleton className="h-5 w-56" /><Skeleton className="mt-3 h-4 w-80 max-w-full" /><div className="mt-6 space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div></div><div className="rounded-xl border bg-card p-5 lg:col-span-2"><Skeleton className="h-5 w-48" /><Skeleton className="mt-6 h-10 w-full" /><Skeleton className="mt-3 h-10 w-full" /><Skeleton className="mt-3 h-10 w-full" /></div></div>
      <div className="grid gap-5 xl:grid-cols-2"><Skeleton className="h-96 w-full rounded-xl" /><Skeleton className="h-96 w-full rounded-xl" /></div>
    </div>
  );
}
