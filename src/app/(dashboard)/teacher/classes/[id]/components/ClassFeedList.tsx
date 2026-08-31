'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Megaphone, Calendar, Paperclip } from 'lucide-react';
import Link from 'next/link';

export interface FeedItem {
  id: string;
  type: 'announcement' | 'lesson';
  title: string;
  content: string | null;
  createdAt: string;
  materials?: Array<{ id: string; name: string; sizeBytes: number }>;
}

export function ClassFeedList({ classId, items }: { classId: string; items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span>Bảng tin & Hoạt động gần đây</span>
            <span className="text-xs font-normal text-zinc-400">0 hoạt động</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-400 space-y-2 border border-dashed rounded-xl">
            <Megaphone className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="text-xs">Chưa có bài giảng, tài liệu hoặc thông báo nào cho lớp này.</p>
            <p className="text-[11px] text-zinc-400">
              Hãy đăng thông báo ở ô trên hoặc vào mục <Link href={`/teacher/classes/${classId}/lessons`} className="text-primary font-medium hover:underline">Bài giảng</Link> để tải lên tài liệu mới.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Bảng tin & Hoạt động gần đây
          </CardTitle>
          <Link
            href={`/teacher/classes/${classId}/lessons`}
            className="text-xs text-primary hover:underline font-medium"
          >
            Xem tất cả bài giảng &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/80 p-0">
        {items.map((item) => {
          const isAnnouncement = item.type === 'announcement' || item.title.includes('[Thông báo]');
          const dateStr = new Date(item.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return (
            <div key={item.id} className="p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isAnnouncement
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  }`}>
                    {isAnnouncement ? <Megaphone className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.title.replace('📢 [Thông báo] ', '')}
                    </h4>
                    <span className="text-[11px] text-zinc-400">{dateStr}</span>
                  </div>
                </div>
                <Badge variant={isAnnouncement ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                  {isAnnouncement ? 'Thông báo' : 'Bài giảng mới'}
                </Badge>
              </div>

              {item.content && (
                <p className="text-xs text-zinc-600 dark:text-zinc-300 pl-10 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              )}

              {/* Tài liệu đính kèm nếu có */}
              {item.materials && item.materials.length > 0 && (
                <div className="pl-10 pt-1 flex items-center gap-2 flex-wrap">
                  {item.materials.map((mat) => (
                    <a
                      key={mat.id}
                      href={`/api/materials/${mat.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      <Paperclip className="w-3 h-3 text-zinc-500" />
                      <span className="truncate max-w-[200px]">{mat.name}</span>
                      <span className="text-[10px] text-zinc-400">({Math.round(mat.sizeBytes / 1024)} KB)</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
