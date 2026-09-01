'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Megaphone, Paperclip, Send, Loader2 } from 'lucide-react';
import { postClassAnnouncementAction } from '../actions';
import { toast } from 'sonner';
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
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  async function handlePost() {
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung thông báo');
      return;
    }

    setIsPosting(true);
    try {
      const res = await postClassAnnouncementAction(classId, content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã đăng thông báo lên bảng tin thành công!');
        setContent('');
      }
    } catch (err: any) {
      toast.error('Lỗi khi đăng thông báo: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Bảng tin & Hoạt động gần đây
        </CardTitle>
      </CardHeader>

      {/* Khung nhập thông báo tích hợp ngay đầu Bảng tin */}
      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
        <Textarea
          rows={2}
          placeholder="Gửi lời nhắc, dặn dò bài tập hoặc thông báo lịch học đến học sinh và phụ huynh..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-xs resize-none bg-background focus-visible:ring-1"
        />
        <div className="flex justify-end pt-0.5">
          <Button
            size="sm"
            onClick={handlePost}
            disabled={isPosting || !content.trim()}
            className="h-8 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-2xs"
          >
            {isPosting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            Đăng thông báo
          </Button>
        </div>
      </div>

      {/* Danh sách các bài giảng & thông báo */}
      <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/80 p-0">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
            <div className="relative mb-2 flex flex-col items-center">
              <Image
                src="/images/empty_states/empty.png"
                alt="Chưa có thông báo"
                width={140}
                height={140}
                className="w-28 h-28 object-contain relative z-10"
              />
              <div className="w-24 h-2 bg-zinc-400/40 dark:bg-zinc-600/40 rounded-[50%] blur-[2px] -mt-[22px] z-0" />
            </div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-1">
              Chưa có bài giảng, tài liệu hoặc thông báo nào trước đó.
            </p>
          </div>
        ) : (
          items.map((item) => {
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
          })
        )}
      </CardContent>
    </Card>
  );
}
