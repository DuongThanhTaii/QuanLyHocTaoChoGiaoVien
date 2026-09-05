'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { postClassAnnouncementAction } from '../actions';
import { toast } from 'sonner';
import { Send, Loader2, Megaphone } from 'lucide-react';

export function ClassAnnouncementBox({ classId }: { classId: string }) {
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
        toast.success('Đã đăng thông báo lên bảng tin lớp học thành công!');
        setContent('');
      }
    } catch (err: any) {
      toast.error('Lỗi khi đăng thông báo: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        <Megaphone className="w-4 h-4 text-amber-500" />
        <span>Đăng thông báo nhanh cho lớp học</span>
      </div>
      <Textarea
        rows={2}
        placeholder="Gửi lời nhắc, dặn dò bài tập hoặc thông báo lịch học đến học sinh và phụ huynh..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-xs resize-none bg-background focus-visible:ring-1"
      />
      <div className="flex justify-between items-center pt-1">
        <span className="text-[11px] text-zinc-400">
          Thông báo sẽ hiển thị trên bảng tin lớp học và gửi tới học sinh.
        </span>
        <Button
          size="sm"
          onClick={handlePost}
          disabled={isPosting || !content.trim()}
          className="h-8 px-3 text-xs shadow-2xs"
        >
          {isPosting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
          Đăng thông báo
        </Button>
      </div>
    </div>
  );
}
