'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleDriveIcon } from '@/components/icons/GoogleDriveIcon';
import { UploadMaterialModal } from './UploadMaterialModal';
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
  FileCheck2,
  FileImage,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MaterialItem {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  type: 'LECTURE' | 'ASSIGNMENT';
  drive_file_id: string;
  drive_view_link: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

interface ContentManagerClientProps {
  userEmail: string;
  isDriveLinked: boolean;
  initialMaterials: MaterialItem[];
}

export function ContentManagerClient({
  userEmail,
  isDriveLinked,
  initialMaterials,
}: ContentManagerClientProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LECTURE' | 'ASSIGNMENT'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUploadSuccess = (newMaterial: MaterialItem) => {
    setMaterials((prev) => [newMaterial, ...prev]);
  };

  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${title}"? Thao tác này cũng sẽ xóa file trên Google Drive.`)) {
      return;
    }

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi xóa tài liệu');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
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

  const getFileIcon = (mimeType: string | null, title: string) => {
    const mime = (mimeType || '').toLowerCase();
    const ext = title.split('.').pop()?.toLowerCase() || '';

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

  const filteredMaterials = materials.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Row: Title on Left, Google Drive Connected Badge on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Bài giảng & Bài tập
          </h1>
        </div>

        {isDriveLinked && (
          <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xs w-fit">
            <GoogleDriveIcon className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <span className="text-zinc-500 mr-1.5">Đã kết nối:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 max-w-[200px] sm:max-w-xs truncate inline-block align-bottom">
                {userEmail}
              </span>
            </div>
            <Link
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-zinc-400 hover:text-blue-600 transition-colors p-0.5 rounded"
              title="Mở Google Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Main Content Tabs & Toolbar */}
      <Tabs defaultValue="library" className="w-full">
        {/* Toolbar: Tabs on Left, Upload Button on Right */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="library">Kho tài liệu gốc</TabsTrigger>
            <TabsTrigger value="assignments">Tình trạng giao bài</TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Tải tài liệu lên
          </Button>
        </div>

        {/* Tab 1: Kho tài liệu gốc */}
        <TabsContent value="library" className="space-y-4 m-0">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Tất cả tài liệu</CardTitle>
                  <CardDescription>
                    Danh sách các bài giảng và bài tập bạn đã tải lên hệ thống.
                  </CardDescription>
                </div>

                {materials.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm tài liệu..."
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                      />
                    </div>

                    <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-900 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterType('ALL')}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          filterType === 'ALL'
                            ? 'bg-white dark:bg-zinc-800 shadow-xs font-semibold text-zinc-900 dark:text-zinc-100'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('LECTURE')}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          filterType === 'LECTURE'
                            ? 'bg-white dark:bg-zinc-800 shadow-xs font-semibold text-blue-600 dark:text-blue-400'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Bài giảng
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('ASSIGNMENT')}
                        className={`px-2 py-1 rounded-md transition-colors ${
                          filterType === 'ASSIGNMENT'
                            ? 'bg-white dark:bg-zinc-800 shadow-xs font-semibold text-amber-600 dark:text-amber-400'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Bài tập
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {materials.length === 0 ? (
                /* Empty State when no materials uploaded yet */
                <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4">
                    <FolderPlus className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                    Kho tài liệu đang trống
                  </p>
                  <p className="text-sm text-zinc-500 max-w-sm mb-5">
                    Bạn chưa tải lên bài giảng hay bài tập nào. Hãy tải lên file đầu tiên để lưu trữ và chia sẻ cho học sinh!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadOpen(true)}
                    className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Tải lên ngay
                  </Button>
                </div>
              ) : filteredMaterials.length === 0 ? (
                /* Empty state when search filter returns nothing */
                <div className="p-8 text-center text-zinc-500">
                  <p className="text-sm font-medium">Không tìm thấy tài liệu phù hợp.</p>
                  <p className="text-xs text-zinc-400 mt-1">Thử tìm kiếm với từ khóa khác.</p>
                </div>
              ) : (
                /* Materials List */
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredMaterials.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                          {getFileIcon(item.mime_type, item.title)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </span>
                            {item.type === 'LECTURE' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                                <BookOpen className="w-3 h-3" />
                                Bài giảng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                                <FileCheck2 className="w-3 h-3" />
                                Bài tập
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                            <span>{formatFileSize(item.file_size_bytes)}</span>
                            <span>•</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {item.drive_view_link && (
                          <Link
                            href={item.drive_view_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "h-8 text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 border-zinc-200 dark:border-zinc-800 inline-flex items-center",
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
                          onClick={() => handleDeleteMaterial(item.id, item.title)}
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

        {/* Tab 2: Tình trạng giao bài */}
        <TabsContent value="assignments" className="m-0">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Tiến độ nộp bài</CardTitle>
                  <CardDescription>Theo dõi tình trạng nộp bài tập của các lớp.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-4">
                  <FileVideo className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                  Chưa giao bài tập nào
                </p>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Sau khi tải tài liệu lên Kho, bạn có thể chọn gắn bài vào lớp học để giao và theo dõi tiến độ nộp bài của học sinh.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
