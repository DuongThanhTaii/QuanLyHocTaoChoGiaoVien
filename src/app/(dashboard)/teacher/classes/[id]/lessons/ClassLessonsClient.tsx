'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, FileText, PlusCircle, Trash2, Users } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { UploadMaterialModal, ClassOption } from '@/app/(dashboard)/teacher/content/components/UploadMaterialModal';
import { deleteExerciseAction, deleteLessonAction } from './actions';
import { toast } from 'sonner';

type SessionTarget = { id: string; type: 'session' | 'slot'; label: string; month?: string; date?: string; startTime?: string | null; endTime?: string | null };
type FileAsset = { name?: string | null; storage_path?: string | null; url?: string | null };
type Lesson = { id: string; session_id?: string | null; title: string; content?: string | null; materials?: FileAsset[] | null };
type Exercise = { id: string; session_id?: string | null; title: string; description?: string | null; due_date?: string | null; attachments?: FileAsset[] | null };
interface Props { classId: string; classes: ClassOption[]; lessons: Lesson[]; exercises: Exercise[]; libraryMaterials: unknown[]; submissionStats: Record<string, { submitted: number; total: number }>; scheduleTargets: Record<string, SessionTarget[]>; }
const dayLabel = (date?: string) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa phân buổi';
const timeLabel = (session?: SessionTarget) => session?.startTime ? `${session.startTime.slice(0, 5)}${session.endTime ? `–${session.endTime.slice(0, 5)}` : ''}` : '';
const localToday = () => { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; };

export function ClassLessonsClient({ classId, classes, lessons: initialLessons, exercises: initialExercises, submissionStats, scheduleTargets }: Props) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [exercises, setExercises] = useState(initialExercises);
  const [uploadOpen, setUploadOpen] = useState(false);
  const sessions = useMemo(() => (scheduleTargets[classId] || []).filter((s) => s.type === 'session').sort((a, b) => String(a.date).localeCompare(String(b.date))), [scheduleTargets, classId]);
  const today = localToday();
  const defaultIndex = Math.max(0, sessions.findIndex((s) => s.date === today) >= 0 ? sessions.findIndex((s) => s.date === today) : sessions.findIndex((s) => String(s.date) > today));
  const [sessionIndex, setSessionIndex] = useState(defaultIndex);
  useEffect(() => setSessionIndex(Math.min(defaultIndex, Math.max(sessions.length - 1, 0))), [defaultIndex, sessions.length]);
  const selected = sessions[sessionIndex];
  const visibleLessons = selected ? lessons.filter((lesson) => lesson.session_id === selected.id) : [];
  const visibleExercises = selected ? exercises.filter((exercise) => exercise.session_id === selected.id) : [];
  const oldCount = lessons.filter((lesson) => !lesson.session_id).length + exercises.filter((exercise) => !exercise.session_id).length;
  const removeLesson = async (id: string, title: string) => { if (!confirm(`Xóa bài giảng “${title}”?`)) return; const result = await deleteLessonAction(id, classId); if (result.error) return toast.error(result.error); setLessons((items) => items.filter((item) => item.id !== id)); router.refresh(); };
  const removeExercise = async (id: string, title: string) => { if (!confirm(`Xóa bài tập “${title}” cùng toàn bộ bài nộp?`)) return; const result = await deleteExerciseAction(id, classId); if (result.error) return toast.error(result.error); setExercises((items) => items.filter((item) => item.id !== id)); router.refresh(); };

  return <div className="space-y-6">
    <section className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Nội dung theo buổi học</p><div className="mt-1 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-600" /><h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{selected ? `${dayLabel(selected.date)}${timeLabel(selected) ? ` - ${timeLabel(selected)}` : ''}` : 'Chọn buổi học'}</h2></div>{selected && (selected.date === today || (selected.date && selected.date > today)) && <p className="mt-1 text-sm text-zinc-500">{selected.date === today ? 'Hôm nay' : 'Sắp diễn ra'}</p>}</div><Button onClick={() => setUploadOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700"><PlusCircle className="mr-2 h-4 w-4" />Đăng nội dung</Button></div>
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1"><Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={!sessionIndex} onClick={() => setSessionIndex((i) => Math.max(0, i - 1))}><ChevronLeft className="h-4 w-4" /></Button>{sessions.map((session, index) => <button key={session.id} onClick={() => setSessionIndex(index)} className={`min-w-28 rounded-lg px-3 py-2 text-left text-xs transition-colors ${index === sessionIndex ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300'}`}><span className="block font-semibold">{session.date === today ? 'Hôm nay' : new Date(`${session.date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span><span className="mt-0.5 block opacity-75">{timeLabel(session) || 'Buổi học'}</span></button>)}<Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={sessionIndex >= sessions.length - 1} onClick={() => setSessionIndex((i) => Math.min(sessions.length - 1, i + 1))}><ChevronRight className="h-4 w-4" /></Button></div>
    </section>
    {!selected ? <div className="py-16 text-center text-sm text-zinc-500">Lớp chưa có buổi học trong lịch. Hãy tạo lịch học trước khi đăng nội dung.</div> : <div className="space-y-8">
      <Section icon={<BookOpen className="h-4 w-4 text-blue-600" />} title={`Bài giảng (${visibleLessons.length})`} empty="Chưa có bài giảng cho buổi này.">{visibleLessons.map((lesson) => { const file = lesson.materials?.[0]; return <article key={lesson.id} className="flex flex-col gap-3 border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800 sm:flex-row sm:justify-between"><div><h3 className="font-medium text-zinc-950 dark:text-zinc-50">{lesson.title}</h3>{lesson.content && <p className="mt-1 text-sm text-zinc-500">{lesson.content}</p>}{file?.storage_path && <a className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline" target="_blank" href={file.storage_path}><FileText className="h-4 w-4" />{file.name}<ExternalLink className="h-3.5 w-3.5" /></a>}</div><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600" onClick={() => removeLesson(lesson.id, lesson.title)}><Trash2 className="h-4 w-4" /></Button></article>;})}</Section>
      <Section icon={<FileText className="h-4 w-4 text-amber-600" />} title={`Bài tập (${visibleExercises.length})`} empty="Chưa có bài tập cho buổi này.">{visibleExercises.map((exercise) => { const stats = submissionStats[exercise.id] || { submitted: 0, total: 0 }; const attachment = Array.isArray(exercise.attachments) ? exercise.attachments[0] : null; return <article key={exercise.id} className="flex flex-col gap-3 border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800 sm:flex-row sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-zinc-950 dark:text-zinc-50">{exercise.title}</h3>{exercise.due_date && <span className="text-xs text-amber-700">Hạn {new Date(exercise.due_date).toLocaleString('vi-VN')}</span>}</div>{exercise.description && <p className="mt-1 text-sm text-zinc-500">{exercise.description}</p>}{attachment?.url && <a className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline" target="_blank" href={attachment.url}><FileText className="h-4 w-4" />{attachment.name}<ExternalLink className="h-3.5 w-3.5" /></a>}<p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500"><Users className="h-3.5 w-3.5" />{stats.submitted}/{stats.total} học sinh đã nộp</p></div><div className="flex shrink-0 gap-1"><Link href={`/teacher/classes/${classId}/assignments/${exercise.id}`} className={buttonVariants({ variant: 'outline', size: 'sm', className: 'text-amber-700' })}>Quản lý bài nộp</Link><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600" onClick={() => removeExercise(exercise.id, exercise.title)}><Trash2 className="h-4 w-4" /></Button></div></article>;})}</Section>
    </div>}
    {oldCount > 0 && <details className="border-t border-zinc-200 pt-4 text-sm text-zinc-500 dark:border-zinc-800"><summary className="cursor-pointer font-medium">Nội dung cũ chưa phân theo buổi ({oldCount})</summary><p className="mt-2">Nội dung này vẫn được giữ nguyên; hãy đăng lại vào buổi phù hợp khi cần.</p></details>}
    <UploadMaterialModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} classes={classes} preSelectedClassId={classId} scheduleTargets={scheduleTargets} onSuccess={() => router.refresh()} />
  </div>;
}

function Section({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode }) { const has = Array.isArray(children) && children.length > 0; return <section><div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">{icon}<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3></div>{has ? children : <p className="py-8 text-sm text-zinc-500">{empty}</p>}</section>; }
