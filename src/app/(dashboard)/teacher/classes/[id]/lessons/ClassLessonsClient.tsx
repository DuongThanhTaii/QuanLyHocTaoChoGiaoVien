'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadMaterialModal, ClassOption } from '@/app/(dashboard)/teacher/content/components/UploadMaterialModal';
import {
  BookOpen,
  FileText,
  PlusCircle,
  ExternalLink,
  Trash2,
  Clock,
  Share2,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteLessonAction, deleteExerciseAction } from './actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClassLessonsClientProps {
  classId: string;
  className: string;
  classSubject?: string | null;
  classes: ClassOption[];
  lessons: any[];
  exercises: any[];
  libraryMaterials: any[];
}

export function ClassLessonsClient({
  classId,
  className,
  classSubject,
  classes,
  lessons: initialLessons,
  exercises: initialExercises,
  libraryMaterials,
}: ClassLessonsClientProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [exercises, setExercises] = useState(initialExercises);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Picker modal state
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [pickerType, setPickerType] = useState<'LECTURE' | 'ASSIGNMENT'>('LECTURE');
  const [pickerDueDate, setPickerDueDate] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isExpired = (dueDateStr?: string | null) => {
    if (!dueDateStr) return false;
    return new Date(dueDateStr).getTime() < Date.now();
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài giảng "${title}" khỏi lớp học?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteLessonAction(id, classId);
      if (res.error) throw new Error(res.error);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      toast.success('Đã xóa bài giảng thành công');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa bài giảng');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteExercise = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài tập "${title}" khỏi lớp học?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteExerciseAction(id, classId);
      if (res.error) throw new Error(res.error);
      setExercises((prev) => prev.filter((e) => e.id !== id));
      toast.success('Đã xóa bài tập thành công');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa bài tập');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAttachFromLibrary = async () => {
    if (!selectedMaterial) return;
    setIsAttaching(true);
    try {
      const res = await fetch('/api/teacher/content/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedMaterial.name,
          storagePath: selectedMaterial.storage_path,
          fileType: selectedMaterial.file_type,
          sizeBytes: selectedMaterial.size_bytes,
          type: pickerType,
          classIds: [classId],
          dueDate: pickerType === 'ASSIGNMENT' && pickerDueDate ? pickerDueDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gắn bài thất bại');

      toast.success('Đã gắn tài liệu từ Kho Drive vào lớp thành công!');
      setIsPickerOpen(false);
      setSelectedMaterial(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsAttaching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Học liệu & Bài tập lớp {className}
          </h2>
          <p className="text-xs text-zinc-500">
            {classSubject ? `Môn: ${classSubject}` : 'Quản lý bài giảng và bài tập giao cho học sinh'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {libraryMaterials.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className="text-xs text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Chọn từ Kho Drive
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Đăng bài mới lên Drive
          </Button>
        </div>
      </div>

      {/* Tabs: Bài giảng & Bài tập */}
      <Tabs defaultValue="lectures" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="lectures" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Bài giảng ({lessons.length})</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Bài tập ({exercises.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Bài giảng */}
        <TabsContent value="lectures" className="space-y-4 m-0">
          {lessons.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-10 text-center text-zinc-500">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-7 h-7" />
              </div>
              <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                Lớp học chưa có bài giảng nào
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Tải lên tài liệu học tập, giáo án hoặc video từ Google Drive để học sinh ôn bài.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="text-xs border-zinc-300 dark:border-zinc-700"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Đăng bài giảng đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lessons.map((lesson) => {
                const attachedFile = lesson.materials?.[0];
                return (
                  <Card key={lesson.id} className="border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {lesson.title}
                          </CardTitle>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Đăng ngày: {formatDate(lesson.created_at)}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === lesson.id}
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 shrink-0"
                        title="Xóa bài giảng"
                      >
                        {deletingId === lesson.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2">
                      {lesson.content && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {lesson.content}
                        </p>
                      )}

                      {attachedFile?.storage_path && (
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 text-xs">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                              {attachedFile.name}
                            </span>
                            {attachedFile.size_bytes && (
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                ({formatFileSize(attachedFile.size_bytes)})
                              </span>
                            )}
                          </div>

                          <Link
                            href={attachedFile.storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-6 text-[11px] text-blue-600 hover:text-blue-700 px-2 shrink-0',
                            })}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Xem Drive
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Bài tập */}
        <TabsContent value="assignments" className="space-y-4 m-0">
          {exercises.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-10 text-center text-zinc-500">
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                Lớp học chưa có bài tập nào
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                Giao bài tập kèm hạn nộp để học sinh làm và gửi bài.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="text-xs border-zinc-300 dark:border-zinc-700"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Giao bài tập đầu tiên
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exercises.map((exercise) => {
                const expired = isExpired(exercise.due_date);
                const attached = Array.isArray(exercise.attachments) ? exercise.attachments[0] : null;

                return (
                  <Card key={exercise.id} className="border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {exercise.title}
                            </CardTitle>
                            {exercise.due_date && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  expired
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                }`}
                              >
                                {expired ? 'Đã hết hạn' : 'Còn hạn'}
                              </span>
                            )}
                          </div>
                          {exercise.due_date && (
                            <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Hạn nộp: {formatDateTime(exercise.due_date)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === exercise.id}
                        onClick={() => handleDeleteExercise(exercise.id, exercise.title)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 shrink-0"
                        title="Xóa bài tập"
                      >
                        {deletingId === exercise.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2">
                      {exercise.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {exercise.description}
                        </p>
                      )}

                      {attached?.url && (
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 text-xs">
                            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                              {attached.name}
                            </span>
                            {attached.size_bytes && (
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                ({formatFileSize(attached.size_bytes)})
                              </span>
                            )}
                          </div>

                          <Link
                            href={attached.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-6 text-[11px] text-blue-600 hover:text-blue-700 px-2 shrink-0',
                            })}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Xem Drive
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Tải bài mới lên Drive cho lớp này */}
      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        classes={classes}
        preSelectedClassId={classId}
        onSuccess={() => router.refresh()}
      />

      {/* Modal: Chọn bài có sẵn từ Kho Drive */}
      <Dialog open={isPickerOpen} onOpenChange={(open) => !open && setIsPickerOpen(false)}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 p-6">
          <DialogHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-600" />
              <span>Chọn tài liệu từ Kho Drive gắn vào lớp</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Pick material */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                1. Chọn tài liệu từ Kho
              </Label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5">
                {libraryMaterials.map((mat) => {
                  const isSelected = selectedMaterial?.storage_path === mat.storage_path;
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => setSelectedMaterial(mat)}
                      className={`w-full text-left p-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 font-semibold border border-blue-200'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="truncate pr-2">{mat.name}</span>
                      <span className="text-[10px] text-zinc-400 shrink-0">{formatFileSize(mat.size_bytes)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pick type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                2. Phân loại bài khi gán vào lớp
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickerType('LECTURE')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                    pickerType === 'LECTURE'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Bài giảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPickerType('ASSIGNMENT')}
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                    pickerType === 'ASSIGNMENT'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 font-semibold'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bài tập</span>
                </button>
              </div>
            </div>

            {/* If assignment, pick due date */}
            {pickerType === 'ASSIGNMENT' && (
              <div className="space-y-1.5 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                <Label className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hạn nộp bài</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={pickerDueDate}
                  onChange={(e) => setPickerDueDate(e.target.value)}
                  className="bg-white border-amber-200 text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setIsPickerOpen(false)} disabled={isAttaching}>
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={!selectedMaterial || isAttaching}
              onClick={handleAttachFromLibrary}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAttaching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Đang gắn...
                </>
              ) : (
                'Gắn vào lớp này'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
