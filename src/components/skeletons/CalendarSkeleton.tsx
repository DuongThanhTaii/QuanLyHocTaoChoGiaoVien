import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {/* Header Lịch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Khung Lịch 7 Ngày */}
      <Card className="flex-1 min-h-0 border-border/60 shadow-xs flex flex-col overflow-hidden bg-card">
        {/* Header Ngày Trong Tuần */}
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30 shrink-0">
          {days.map((day, i) => (
            <div key={i} className="p-3 text-center border-r border-border/60 last:border-r-0 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{day}</span>
              <div className="flex justify-center">
                <Skeleton className="h-6 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Lưới Giờ & Buổi học Placeholder */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-border/60 overflow-y-auto p-2 bg-background/50">
          {Array.from({ length: 7 }).map((_, colIndex) => (
            <div key={colIndex} className="p-1 space-y-3 min-h-[300px]">
              {colIndex === 1 && (
                <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5 shadow-2xs">
                  <Skeleton className="h-4 w-3/4 bg-primary/20" />
                  <Skeleton className="h-3 w-1/2 bg-primary/10" />
                  <Skeleton className="h-3 w-2/3 bg-primary/10" />
                </div>
              )}
              {colIndex === 3 && (
                <>
                  <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-1.5 shadow-2xs">
                    <Skeleton className="h-4 w-4/5 bg-blue-500/20" />
                    <Skeleton className="h-3 w-3/5 bg-blue-500/10" />
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1.5 shadow-2xs">
                    <Skeleton className="h-4 w-2/3 bg-emerald-500/20" />
                    <Skeleton className="h-3 w-1/2 bg-emerald-500/10" />
                  </div>
                </>
              )}
              {colIndex === 5 && (
                <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-1.5 shadow-2xs">
                  <Skeleton className="h-4 w-3/4 bg-purple-500/20" />
                  <Skeleton className="h-3 w-1/2 bg-purple-500/10" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
