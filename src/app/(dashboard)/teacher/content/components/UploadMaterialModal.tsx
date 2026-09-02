'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newMaterial: any) => void;
}

export function UploadMaterialModal({ isOpen, onClose, onSuccess }: UploadMaterialModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'LECTURE' | 'ASSIGNMENT'>('LECTURE');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setType('LECTURE');
    setDescription('');
    setIsUploading(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);

    // Auto-fill title if currently empty or user hasn't typed custom title
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
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

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên tài liệu.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('type', type);
    formData.append('description', description.trim());

    try {
      const response = await fetch('/api/teacher/content/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tải file lên.');
      }

      toast.success('Tải tài liệu lên Google Drive thành công!');
      resetForm();
      onClose();

      if (onSuccess && data.material) {
        onSuccess(data.material);
      }
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Lỗi không xác định khi tải lên');
      toast.error(err.message || 'Tải tài liệu thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50">
              <GoogleDriveIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Tải tài liệu lên Google Drive
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                File sẽ được lưu trữ an toàn trong Google Drive của bạn và hiển thị trong Kho học liệu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
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
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                Kéo thả file vào đây hoặc <span className="text-blue-600 dark:text-blue-400 hover:underline">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Hỗ trợ PDF, Word, Excel, PowerPoint, MP4, Zip và hình ảnh
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(file.size)}
                  </p>
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

          {/* Material Category Type */}
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

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="material-title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tên bài giảng / bài tập <span className="text-red-500">*</span>
            </Label>
            <Input
              id="material-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Giáo án Tuần 1 - Số học nâng cao"
              required
              disabled={isUploading}
              className="bg-white dark:bg-zinc-900"
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
              placeholder="Ghi chú thêm về nội dung, yêu cầu ôn tập hoặc hạn hoàn thành..."
              rows={2}
              disabled={isUploading}
              className="bg-white dark:bg-zinc-900 text-sm resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
