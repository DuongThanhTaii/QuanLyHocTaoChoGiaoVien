import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showFilters?: boolean;
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  showHeader = true,
  showFilters = true,
}: TableSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      )}

      {showFilters && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-3 rounded-lg border border-border/60">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      )}

      <Card className="border-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="h-11 px-4 text-left align-middle font-medium">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="p-4 align-middle">
                      {colIndex === 0 ? (
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                      ) : colIndex === columns - 1 ? (
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      ) : (
                        <Skeleton className="h-4 w-24" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-border/60 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}
