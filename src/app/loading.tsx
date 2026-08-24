import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <p className="text-sm font-medium text-zinc-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
