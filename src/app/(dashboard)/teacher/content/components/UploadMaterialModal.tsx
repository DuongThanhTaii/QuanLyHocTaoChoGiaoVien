'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { GoogleDriveIcon } from '@/components/icons/GoogleDriveIcon';
import {
  UploadCloud,
  FileText,
  BookOpen,
  X,
  Loader2,
  AlertCircle,
  FileCheck2,
  Calendar,
  Check,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface ClassOption {
  id: string;
  name: string;
  subject?: string | null;
  color?: string | null;
}

// Files are sent through a Vercel Route Handler before reaching Google Drive.
// Keep a small margin below the platform request-body limit so the user gets a
// useful validation message instead of a non-JSON "Request Entity Too Large" response.
const MAX_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;

type UploadResponse = {
  error?: string;
  [key: string]: unknown;
};

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: ClassOption[];
  preSelectedClassId?: string;
  onSuccess?: (result?: UploadResponse) => void;
}

export function UploadMaterialModal({
  isOpen,
  onClose,
  classes = [],
  preSelectedClassId,
  onSuccess,
}: UploadMaterialModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'LECTURE' | 'ASSIGNMENT'>('LECTURE');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedClassId) {
      setSelectedClassIds([preSelectedClassId]);
    } else if (classes.length === 1) {
      setSelectedClassIds([classes[0].id]);
    }
  }, [preSelectedClassId, classes]);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setType('LECTURE');
    setDescription('');
    setDueDate('');
    if (preSelectedClassId) {
      setSelectedClassIds([preSelectedClassId]);
    } else if (classes.length === 1) {
      setSelectedClassIds([classes[0].id]);
    } else {
      setSelectedClassIds([]);
    }
    setIsUploading(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setFile(null);
      setErrorMessage('Tệp tối đa 4 MB. Vui lòng chọn tệp nhỏ hơn hoặc nén tệp trước khi tải lên.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);

    if (!title || title.trim() === '') {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    setSelectedClassIds(classes.map((c) => c.id));
  };

  const deselectAllClasses = () => {
    setSelectedClassIds([]);
  };

  const setDueDatePreset = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    d.setHours(23, 59, 0, 0);
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setDueDate(localISOTime);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Vui lòng chọn hoặc kéo thả một file tài liệu.');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setErrorMessage('Tệp tối đa 4 MB. Vui lòng chọn tệp nhỏ hơn hoặc nén tệp trước khi tải lên.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên bài giảng / bài tập.');
      return;
    }

    if (classes.length > 0 && selectedClassIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một lớp học để đăng bài.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('type', type);
    formData.append('description', description.trim());
    formData.append('classIds', JSON.stringify(selectedClassIds));
    if (type === 'ASSIGNMENT' && dueDate) {
      formData.append('dueDate', dueDate);
    }

    try {
      const response = await fetch('/api/teacher/content/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let data: UploadResponse;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        if (response.status === 413 || /request entity too large/i.test(responseText)) {
          throw new Error('Tệp quá lớn để tải lên. Vui lòng chọn tệp tối đa 4 MB hoặc nén tệp trước khi thử lại.');
        }

        throw new Error('Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại sau ít phút.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải file lên.');
      }

      toast.success(
        type === 'LECTURE'
          ? `Đã đăng bài giảng cho ${selectedClassIds.length} lớp học thành công!`
          : `Đã giao bài tập cho ${selectedClassIds.length} lớp học thành công!`
      );
      resetForm();
      onClose();

      if (onSuccess) {
        onSuccess(data);
      }
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Lỗi không xác định khi tải lên';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 p-6">
        <DialogHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50">
              <GoogleDriveIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Tải tài liệu lên Google Drive
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-400 bg-zinc-50/50 dark:bg-zinc-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileInputChange}
              />
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-0.5">
                Kéo thả file vào đây hoặc <span className="text-blue-600 dark:text-blue-400 hover:underline">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Hỗ trợ PDF, Word, Excel, PowerPoint, MP4, Zip và hình ảnh (tối đa 4 MB)
              </p>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-zinc-400 hover:text-red-500 shrink-0 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Phân loại tài liệu */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Phân loại tài liệu
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('LECTURE')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                  type === 'LECTURE'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
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
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Bài tập</span>
              </button>
            </div>
          </div>

          {/* Chọn lớp học nhận bài */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Chọn lớp nhận bài <span className="text-red-500">*</span></span>
              </Label>
              {classes.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllClasses}
                    className="text-blue-600 hover:underline"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={deselectAllClasses}
                    className="text-zinc-500 hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>

            {classes.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                Bạn chưa có lớp học nào. Hãy tạo lớp học trước khi đăng bài.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
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
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold truncate">{cls.name}</p>
                        {cls.subject && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {cls.subject}
                          </p>
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
            )}
          </div>

          {/* Hạn nộp bài (Chỉ hiện khi là BÀI TẬP) */}
          {type === 'ASSIGNMENT' && (
            <div className="space-y-2 p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="assignment-due"
                  className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hạn nộp bài tập</span>
                </Label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDueDatePreset(1)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                  >
                    +24h
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDatePreset(3)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                  >
                    +3 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDatePreset(7)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 hover:bg-amber-100"
                  >
                    +1 tuần
                  </button>
                </div>
              </div>
              <Input
                id="assignment-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isUploading}
                className="bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800 text-xs"
              />
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="material-title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tên bài giảng / bài tập <span className="text-red-500">*</span>
            </Label>
            <Input
              id="material-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Bài tập Tuần 1 - Phân loại dữ liệu"
              required
              disabled={isUploading}
              className="bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label htmlFor="material-desc" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Mô tả / Ghi chú <span className="text-zinc-400 font-normal">(không bắt buộc)</span>
            </Label>
            <Textarea
              id="material-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về yêu cầu hoàn thành..."
              rows={2}
              disabled={isUploading}
              className="bg-white dark:bg-zinc-900 text-sm resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải lên Drive...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Tải lên ngay
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
