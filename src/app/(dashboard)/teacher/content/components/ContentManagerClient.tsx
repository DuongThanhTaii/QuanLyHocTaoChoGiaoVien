'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleDriveIcon } from '@/components/icons/GoogleDriveIcon';
import { UploadMaterialModal, ClassOption } from './UploadMaterialModal';
import { AssignToClassModal } from './AssignToClassModal';
import { DriveStorageWidget } from './DriveStorageWidget';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ExternalLink,
  PlusCircle,
  FolderPlus,
  FileVideo,
  FileText,
  BookOpen,
  Trash2,
  Search,
  FileType,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  FileImage,
  Loader2,
  Calendar,
  Share2,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface MaterialRow {
  id: string;
  class_id?: string;
  lesson_id?: string | null;
  name: string;
  storage_path: string;
  file_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
  classes?: { id: string; name: string }[];
}

export interface LessonRow {
  id: string;
  class_id: string;
  title: string;
  content?: string | null;
  created_at: string;
  materials?: any[];
}

export interface ExerciseRow {
  id: string;
  class_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  max_score?: number | null;
  attachments?: any;
  created_at: string;
}

interface ContentManagerClientProps {
  isDriveLinked: boolean;
  classes: ClassOption[];
  initialMaterials: MaterialRow[];
  lessons: LessonRow[];
  exercises: ExerciseRow[];
}

export function ContentManagerClient({
  isDriveLinked,
  classes,
  initialMaterials,
  lessons,
  exercises,
}: ContentManagerClientProps) {
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialRow[]>(initialMaterials);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [preSelectedClassForUpload, setPreSelectedClassForUpload] = useState<string | undefined>();
  const [assigningMaterial, setAssigningMaterial] = useState<MaterialRow | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [materialPendingDeletion, setMaterialPendingDeletion] = useState<MaterialRow | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  const handleUploadSuccess = () => {
    window.dispatchEvent(new Event('materials:changed'));
    router.refresh();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMaterials.map((m) => m.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(false);
    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/teacher/content/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');

      toast.success(`Đã xóa ${selectedIds.length} tệp và cập nhật dung lượng thành công!`);
      setSelectedIds([]);
      window.dispatchEvent(new Event('materials:changed'));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa tệp');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    setMaterialPendingDeletion(null);
    setDeletingId(id);
    try {
      const res = await fetch('/api/teacher/content/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa tài liệu thất bại');
      }

      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success('Đã xóa tài liệu thành công!');
      window.dispatchEvent(new Event('materials:changed'));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi xóa tài liệu');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
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

  const getFileIcon = (mimeType?: string | null, title?: string) => {
    const mime = (mimeType || '').toLowerCase();
    const ext = (title || '').split('.').pop()?.toLowerCase() || '';

    if (mime.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (mime.includes('video') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    }
    if (mime.includes('word') || ['doc', 'docx'].includes(ext)) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mime.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mime.includes('presentation') || ['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="w-5 h-5 text-amber-500" />;
    }
    if (mime.includes('zip') || ['zip', 'rar', '7z', 'tar'].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-yellow-600" />;
    }
    if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      return <FileImage className="w-5 h-5 text-pink-500" />;
    }
    return <FileType className="w-5 h-5 text-zinc-500" />;
  };

  // Metrics for overview
  const totalLessons = lessons.length;
  const totalExercises = exercises.length;
  const openExercises = exercises.filter((e) => e.due_date && !isExpired(e.due_date)).length;
  const expiredExercises = exercises.filter((e) => e.due_date && isExpired(e.due_date)).length;

  const filteredMaterials = materials.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeClasses = selectedClassFilter === 'ALL'
    ? classes
    : classes.filter((c) => c.id === selectedClassFilter);

  return (
    <div className="space-y-6">
      {/* 1. Header: Title on Left, Drive Badge on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bài giảng & Bài tập
          </h1>
        </div>

        {isDriveLinked && (
          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xs w-fit">
            <GoogleDriveIcon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Đã kết nối</span>
          </div>
        )}
      </div>

      {/* Storage Quota Widget */}
      {isDriveLinked && <DriveStorageWidget />}

      {/* 2. Main Content Tabs & Toolbar */}
      <Tabs defaultValue="library" className="w-full">
        {/* Toolbar: Tabs on Left, Upload Button on Right */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="library">Kho tài liệu gốc</TabsTrigger>
            <TabsTrigger value="classes_overview">Tổng quan theo lớp</TabsTrigger>
          </TabsList>

          <Button
            onClick={() => {
              setPreSelectedClassForUpload(undefined);
              setIsUploadOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Tải tài liệu lên
          </Button>
        </div>

        {/* Tab 1: Kho tài liệu gốc */}
        <TabsContent value="library" className="space-y-4 m-0">
          {/* Bulk Action Bar if items selected */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Đã chọn {selectedIds.length} tệp</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="h-7 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Bỏ chọn
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isBulkDeleting}
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="h-7 text-xs shadow-xs"
                >
                  {isBulkDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Xóa các tệp đã chọn
                </Button>
              </div>
            </div>
          )}

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {filteredMaterials.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-xs text-zinc-500 cursor-pointer select-none">
                        Chọn tất cả
                      </label>
                    </div>
                  )}
                  <CardTitle className="text-lg">Tất cả tài liệu</CardTitle>
                </div>

                {materials.length > 0 && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm tài liệu..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-64"
                    />
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {materials.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4">
                    <FolderPlus className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                    Kho tài liệu đang trống
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreSelectedClassForUpload(undefined);
                      setIsUploadOpen(true);
                    }}
                    className="mt-3 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Tải lên ngay
                  </Button>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp.</p>
                  <p className="text-xs text-zinc-400 mt-1">Thử tìm kiếm với từ khóa khác.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredMaterials.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        selectedIds.includes(item.id)
                          ? 'bg-blue-50/40 dark:bg-blue-950/20'
                          : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="pt-2.5">
                          <Checkbox
                            checked={selectedIds.includes(item.id)}
                            onCheckedChange={() => toggleSelectOne(item.id)}
                          />
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                          {getFileIcon(item.file_type, item.name)}
                        </div>

                        <div className="min-w-0">
                          {item.storage_path ? <Link href={item.storage_path} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold text-zinc-900 transition hover:text-blue-600 hover:underline dark:text-zinc-100 dark:hover:text-blue-400" title="Mở tệp trên Google Drive">{item.name}</Link> : <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>}
                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                            <span>{formatFileSize(item.size_bytes)}</span>
                            <span>•</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssigningMaterial(item)}
                          className="h-8 text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40"
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1.5" />
                          Giao cho lớp
                        </Button>

                        {item.storage_path && (
                          <Link
                            href={item.storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                              className: 'h-8 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 border-zinc-200 dark:border-zinc-800 inline-flex items-center',
                            })}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Xem trên Drive
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === item.id}
                          onClick={() => setMaterialPendingDeletion(item)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Xóa tài liệu"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Tổng quan theo lớp */}
        <TabsContent value="classes_overview" className="space-y-6 m-0">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Bài giảng đã đăng</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{totalLessons}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Bài tập đã giao</p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{totalExercises}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Bài tập còn hạn</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{openExercises}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Bài tập đã quá hạn</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{expiredExercises}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Lọc theo lớp:</span>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả các lớp ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.subject ? `(${c.subject})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classes Cards List */}
          {activeClasses.length === 0 ? (
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center text-zinc-500">
              <GraduationCap className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Chưa có lớp học nào</p>
              <p className="text-xs text-zinc-400 mt-1">Hãy tạo lớp học tại trang quản lý lớp học trước.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {activeClasses.map((cls) => {
                const classLessons = lessons.filter((l) => l.class_id === cls.id);
                const classExercises = exercises.filter((e) => e.class_id === cls.id);

                return (
                  <Card key={cls.id} className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-zinc-50/70 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 py-3 px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                          <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              {cls.name}
                            </h3>
                            {cls.subject && (
                              <span className="text-xs text-zinc-500">Môn: {cls.subject}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreSelectedClassForUpload(cls.id);
                              setIsUploadOpen(true);
                            }}
                            className="h-7 text-xs border-zinc-200 dark:border-zinc-700"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            Đăng bài cho lớp này
                          </Button>

                          <Link
                            href={`/teacher/classes/${cls.id}/lessons`}
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-7 text-xs text-blue-600 hover:text-blue-700 p-1',
                            })}
                          >
                            Vào lớp <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      {/* Sub-section: Bài giảng */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Bài giảng ({classLessons.length})
                          </h4>
                        </div>

                        {classLessons.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic pl-6">Chưa có bài giảng nào được đăng.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {classLessons.map((les) => {
                              const attachedFile = les.materials?.[0];
                              return (
                                <div
                                  key={les.id}
                                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start justify-between gap-2 shadow-2xs"
                                >
                                  <div className="min-w-0 flex items-start gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                        {les.title}
                                      </p>
                                      {les.content && (
                                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                          {les.content}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-zinc-400 mt-1">
                                        Đăng ngày: {formatDate(les.created_at)}
                                      </p>
                                    </div>
                                  </div>

                                  {attachedFile?.storage_path && (
                                    <Link
                                      href={attachedFile.storage_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-zinc-400 hover:text-blue-600 shrink-0 p-1"
                                      title="Xem trên Drive"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sub-section: Bài tập */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                            Bài tập ({classExercises.length})
                          </h4>
                        </div>

                        {classExercises.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic pl-6">Chưa có bài tập nào được giao.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {classExercises.map((ex) => {
                              const expired = isExpired(ex.due_date);
                              const attached = Array.isArray(ex.attachments) ? ex.attachments[0] : null;
                              return (
                                <div
                                  key={ex.id}
                                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-start justify-between gap-2 shadow-2xs"
                                >
                                  <div className="min-w-0 flex items-start gap-2.5">
                                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                          {ex.title}
                                        </p>
                                        {ex.due_date && (
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

                                      {ex.description && (
                                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                                          {ex.description}
                                        </p>
                                      )}

                                      {ex.due_date && (
                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                                          <Clock className="w-3 h-3 text-amber-500" />
                                          <span>Hạn nộp: {formatDateTime(ex.due_date)}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {attached?.url && (
                                    <Link
                                      href={attached.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-zinc-400 hover:text-blue-600 shrink-0 p-1"
                                      title="Xem trên Drive"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={materialPendingDeletion !== null} onOpenChange={(open) => !open && setMaterialPendingDeletion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle>
            <AlertDialogDescription>Tài liệu “{materialPendingDeletion?.name}” sẽ bị xóa khỏi Mari và Google Drive. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={!materialPendingDeletion || deletingId !== null} onClick={() => materialPendingDeletion && handleDeleteMaterial(materialPendingDeletion.id)}>{deletingId ? 'Đang xóa...' : 'Xóa tài liệu'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedIds.length} tệp đã chọn?</AlertDialogTitle>
            <AlertDialogDescription>Các học liệu được chọn sẽ bị xóa khỏi Mari và Google Drive. Thao tác này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isBulkDeleting || selectedIds.length === 0} onClick={handleBulkDelete}>{isBulkDeleting ? 'Đang xóa...' : 'Xóa các tệp'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        classes={classes}
        preSelectedClassId={preSelectedClassForUpload}
        onSuccess={handleUploadSuccess}
      />

      {/* Assign to Class Modal */}
      <AssignToClassModal
        isOpen={!!assigningMaterial}
        onClose={() => setAssigningMaterial(null)}
        material={assigningMaterial}
        classes={classes}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
