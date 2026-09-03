'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  UploadCloud,
  FileCheck2,
  Clock,
  Loader2,
  Link2,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface StudentSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
  } | null;
  classId: string;
  previousSubmission?: {
    storage_path?: string;
    created_at?: string;
  } | null;
  onSuccess?: () => void;
}

export function StudentSubmitModal({
  isOpen,
  onClose,
  exercise,
  classId,
  previousSubmission,
  onSuccess,
}: StudentSubmitModalProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (previousSubmission?.storage_path) {
      if (previousSubmission.storage_path.startsWith('http')) {
        setAttachmentUrl(previousSubmission.storage_path);
      } else {
        setContent(previousSubmission.storage_path);
      }
    } else {
      setContent('');
      setAttachmentUrl('');
    }
  }, [previousSubmission, isOpen]);

  if (!exercise) return null;

  const isExpired = exercise.due_date ? new Date(exercise.due_date).getTime() < Date.now() : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachmentUrl.trim()) {
      toast.error('Vui lòng nhập nội dung bài làm hoặc dán link bài nộp');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          classId,
          content: content.trim(),
          attachmentUrl: attachmentUrl.trim(),
          fileName: exercise.title,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nộp bài thất bại');

      toast.success(previousSubmission ? 'Cập nhật bài nộp thành công!' : 'Nộp bài tập thành công!');
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 p-6">
        <DialogHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {previousSubmission ? 'Cập nhật bài nộp' : 'Nộp bài tập'}
              </DialogTitle>
              <p className="text-xs text-zinc-500 font-medium truncate max-w-sm">
                {exercise.title}
              </p>
            </div>
          </div>
        </DialogHeader>

        {exercise.due_date && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
              isExpired
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Hạn nộp: {new Date(exercise.due_date).toLocaleString('vi-VN')}
              </span>
            </div>
            <span className="font-semibold text-[11px]">
              {isExpired ? 'Đã hết hạn' : 'Đang mở'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Link Drive bài làm */}
          <div className="space-y-1.5">
            <Label htmlFor="submit-link" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Link bài làm (Google Drive, Docs, Sheets, Canva, PDF...)</span>
            </Label>
            <Input
              id="submit-link"
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="bg-white dark:bg-zinc-900 text-xs"
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-zinc-400">
              Hãy đảm bảo đã bật quyền "Bất kỳ ai có đường liên kết đều có thể xem".
            </p>
          </div>

          {/* Textarea ghi chú / bài làm văn bản */}
          <div className="space-y-1.5">
            <Label htmlFor="submit-content" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nội dung bài làm / Lời nhắn cho thầy cô
            </Label>
            <Textarea
              id="submit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ghi chú bài làm hoặc nội dung trả lời câu hỏi..."
              rows={4}
              className="bg-white dark:bg-zinc-900 text-xs resize-none"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang nộp...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {previousSubmission ? 'Cập nhật bài nộp' : 'Gửi bài nộp'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
