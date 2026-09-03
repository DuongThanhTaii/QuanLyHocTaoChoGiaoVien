'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClassOption } from './UploadMaterialModal';
import {
  GraduationCap,
  Calendar,
  Check,
  Loader2,
  BookOpen,
  FileText,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AssignToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    name: string;
    storage_path: string;
    file_type?: string | null;
    size_bytes?: number | null;
  } | null;
  classes: ClassOption[];
  onSuccess?: () => void;
}

export function AssignToClassModal({
  isOpen,
  onClose,
  material,
  classes,
  onSuccess,
}: AssignToClassModalProps) {
  const router = useRouter();
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [type, setType] = useState<'LECTURE' | 'ASSIGNMENT'>('LECTURE');
  const [dueDate, setDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  if (!material) return null;

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lớp học');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch('/api/teacher/content/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: material.name,
          storagePath: material.storage_path,
          fileType: material.file_type,
          sizeBytes: material.size_bytes,
          type,
          classIds: selectedClassIds,
          dueDate: type === 'ASSIGNMENT' && dueDate ? dueDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gán bài vào lớp thất bại');
      }

      toast.success(`Đã gắn tài liệu vào ${selectedClassIds.length} lớp học thành công!`);
      setSelectedClassIds([]);
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 p-6">
        <DialogHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Giao bài cho lớp học
              </DialogTitle>
              <p className="text-xs text-zinc-500 font-medium truncate max-w-sm mt-0.5">
                {material.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAssign} className="space-y-4 pt-2">
          {/* Phân loại tài liệu */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Giao dưới dạng
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('LECTURE')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  type === 'LECTURE'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 ring-1 ring-blue-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Bài giảng</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ASSIGNMENT')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  type === 'ASSIGNMENT'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ring-1 ring-amber-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Bài tập</span>
              </button>
            </div>
          </div>

          {/* Chọn lớp học */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Chọn các lớp cần giao</span>
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
              {classes.map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{cls.name}</p>
                      {cls.subject && (
                        <p className="text-[11px] text-zinc-500 truncate">{cls.subject}</p>
                      )}
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hạn nộp nếu là bài tập */}
          {type === 'ASSIGNMENT' && (
            <div className="space-y-1.5 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
              <Label htmlFor="assign-due" className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Hạn nộp bài</span>
              </Label>
              <Input
                id="assign-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800 text-xs"
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isAssigning}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isAssigning || selectedClassIds.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang giao bài...
                </>
              ) : (
                'Giao bài ngay'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
