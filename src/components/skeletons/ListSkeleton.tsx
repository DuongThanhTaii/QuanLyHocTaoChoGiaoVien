import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-56 mt-2" /></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
