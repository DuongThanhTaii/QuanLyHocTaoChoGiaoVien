import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <Card className="border-border/60 shadow-xs overflow-hidden flex h-[calc(100vh-10rem)] min-h-[550px] bg-card">
      {/* Cột trái: Danh sách hội thoại */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-full border-r border-border/60 flex flex-col">
        {/* Header & Search */}
        <div className="p-3 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        {/* Danh sách các cuộc trò chuyện */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border/40"
            >
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột phải: Khung tin nhắn */}
      <div className="hidden md:flex flex-1 flex-col h-full bg-background/40">
        {/* Header Chat */}
        <div className="h-16 px-4 border-b border-border/60 flex items-center justify-between bg-card/60 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Khung tin nhắn bong bóng */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Tin nhắn bên trái (Người khác) */}
          <div className="flex items-start gap-2 max-w-[70%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="space-y-1">
              <Skeleton className="h-12 w-56 rounded-2xl rounded-tl-none bg-muted" />
              <Skeleton className="h-2.5 w-12 ml-1" />
            </div>
          </div>

          {/* Tin nhắn bên phải (Tôi) */}
          <div className="flex items-start justify-end gap-2 ml-auto max-w-[70%]">
            <div className="space-y-1 flex flex-col items-end">
              <Skeleton className="h-16 w-64 rounded-2xl rounded-tr-none bg-primary/20" />
              <Skeleton className="h-2.5 w-12 mr-1" />
            </div>
          </div>

          {/* Tin nhắn bên trái (Người khác) */}
          <div className="flex items-start gap-2 max-w-[70%]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
            <div className="space-y-1">
              <Skeleton className="h-10 w-44 rounded-2xl rounded-tl-none bg-muted" />
              <Skeleton className="h-2.5 w-12 ml-1" />
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/60 bg-card/80 flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </Card>
  );
}
