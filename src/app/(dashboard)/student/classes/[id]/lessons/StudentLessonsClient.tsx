'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentSubmitModal } from './StudentSubmitModal';
import {
  BookOpen,
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
} from 'lucide-react';

interface StudentLessonsClientProps {
  classId: string;
  className: string;
  classSubject?: string | null;
  lessons: any[];
  exercises: any[];
  mySubmissions: Record<string, any>; // keyed by exerciseId
}

export function StudentLessonsClient({
  classId,
  className,
  classSubject,
  lessons,
  exercises,
  mySubmissions,
}: StudentLessonsClientProps) {
  const [selectedExerciseForSubmit, setSelectedExerciseForSubmit] = useState<any | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Học liệu & Bài tập lớp {className}
          </h2>
          <p className="text-xs text-zinc-500">
            {classSubject ? `Môn: ${classSubject} • ` : ''}Xem bài giảng và nộp bài tập về nhà cho giáo viên
          </p>
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
                Chưa có bài giảng nào
              </p>
              <p className="text-xs text-zinc-400">
                Giáo viên chưa đăng tải tài liệu bài giảng cho lớp này.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lessons.map((lesson) => {
                const attached = lesson.materials?.[0];
                return (
                  <Card key={lesson.id} className="border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {lesson.title}
                          </CardTitle>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Đăng ngày: {formatDate(lesson.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      {lesson.content && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                          {lesson.content}
                        </p>
                      )}

                      {attached?.storage_path ? (
                        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 text-xs">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                              {attached.name || 'Tài liệu bài giảng'}
                            </span>
                          </div>

                          <Link
                            href={attached.storage_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                              className: 'h-7 text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 inline-flex items-center shrink-0',
                            })}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Xem bài giảng
                          </Link>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">Không có file đính kèm.</p>
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
                Chưa có bài tập nào
              </p>
              <p className="text-xs text-zinc-400">
                Thầy cô chưa giao bài tập cho lớp học này.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exercises.map((exercise) => {
                const expired = isExpired(exercise.due_date);
                const attached = Array.isArray(exercise.attachments) ? exercise.attachments[0] : null;
                const submission = mySubmissions[exercise.id];

                return (
                  <Card key={exercise.id} className="border-zinc-200 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {exercise.title}
                            </CardTitle>
                            {exercise.due_date && (
                              <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>Hạn nộp: {formatDateTime(exercise.due_date)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {exercise.due_date && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                expired
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                              }`}
                            >
                              {expired ? 'Đã hết hạn' : 'Còn hạn'}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3">
                      {exercise.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                          {exercise.description}
                        </p>
                      )}

                      {/* Attached prompt on Drive */}
                      {attached?.url && (
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            📎 Đề bài: {attached.name || 'Tài liệu đề bài'}
                          </span>
                          <Link
                            href={attached.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline inline-flex items-center shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Xem đề
                          </Link>
                        </div>
                      )}

                      {/* Submission status & Action */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div>
                          {submission ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã nộp bài</span>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400">
                              Chưa nộp bài
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          onClick={() => setSelectedExerciseForSubmit(exercise)}
                          className={`h-7 text-xs ${
                            submission
                              ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          {submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Assignment Modal */}
      <StudentSubmitModal
        isOpen={!!selectedExerciseForSubmit}
        onClose={() => setSelectedExerciseForSubmit(null)}
        exercise={selectedExerciseForSubmit}
        classId={classId}
        previousSubmission={selectedExerciseForSubmit ? mySubmissions[selectedExerciseForSubmit.id] : null}
      />
    </div>
  );
}
