import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardGridSkeletonProps {
  count?: number;
  columns?: string;
  showHeader?: boolean;
}

export function CardGridSkeleton({
  count = 6,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  showHeader = true,
}: CardGridSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md shrink-0" />
        </div>
      )}

      <div className={`grid gap-6 ${columns}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="border-border/60 shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1 mr-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 border-t border-border/40">
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
