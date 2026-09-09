'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentSubmitModal } from './StudentSubmitModal';

type FileAsset = { name?: string | null; storage_path?: string | null; url?: string | null };
type Lesson = { id: string; session_id?: string | null; title: string; content?: string | null; materials?: FileAsset[] | null };
type Exercise = { id: string; session_id?: string | null; title: string; description?: string | null; due_date?: string | null; attachments?: FileAsset[] | null };
type Submission = { is_late?: boolean; score?: number | null; teacher_feedback?: string | null };
interface Props { classId: string; lessons: Lesson[]; exercises: Exercise[]; sessions: Array<{ id: string; session_date: string; start_time?: string | null; end_time?: string | null }>; mySubmissions: Record<string, Submission>; }
const time = (item?: { start_time?: string | null; end_time?: string | null }) => item?.start_time ? `${item.start_time.slice(0, 5)}${item.end_time ? `–${item.end_time.slice(0, 5)}` : ''}` : '';
const dateName = (date?: string) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const localToday = () => { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; };

export function StudentLessonsClient({ classId, lessons, exercises, sessions, mySubmissions }: Props) {
  const [exerciseToSubmit, setExerciseToSubmit] = useState<Exercise | null>(null);
  const ordered = useMemo(() => [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date)), [sessions]);
  const today = localToday();
  const firstIndex = Math.max(0, ordered.findIndex((session) => session.session_date === today) >= 0 ? ordered.findIndex((session) => session.session_date === today) : ordered.findIndex((session) => session.session_date > today));
  const [index, setIndex] = useState(firstIndex);
  useEffect(() => setIndex(Math.min(firstIndex, Math.max(ordered.length - 1, 0))), [firstIndex, ordered.length]);
  const selected = ordered[index];
  const dayLessons = selected ? lessons.filter((lesson) => lesson.session_id === selected.id) : [];
  const dayExercises = selected ? exercises.filter((exercise) => exercise.session_id === selected.id) : [];
  const isFuture = Boolean(selected?.session_date && selected.session_date > today);

  return <div className="space-y-6">
    <section className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Nội dung theo buổi học</p>
      <div className="mt-1 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-blue-600" /><h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{selected ? `${dateName(selected.session_date)}${time(selected) ? ` - ${time(selected)}` : ''}` : 'Chưa có lịch học'}</h2></div>
      {selected && (selected.session_date === today || isFuture) && <p className="mt-1 text-sm text-zinc-500">{selected.session_date === today ? 'Hôm nay' : 'Sắp diễn ra'}</p>}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1"><Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={!index} onClick={() => setIndex((i) => Math.max(0, i - 1))}><ChevronLeft className="h-4 w-4" /></Button>{ordered.map((session, itemIndex) => <button key={session.id} onClick={() => setIndex(itemIndex)} className={`min-w-28 rounded-lg px-3 py-2 text-left text-xs transition-colors ${itemIndex === index ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300'}`}><span className="block font-semibold">{session.session_date === today ? 'Hôm nay' : new Date(`${session.session_date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span><span className="mt-0.5 block opacity-75">{time(session) || 'Buổi học'}</span></button>)}<Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={index >= ordered.length - 1} onClick={() => setIndex((i) => Math.min(ordered.length - 1, i + 1))}><ChevronRight className="h-4 w-4" /></Button></div>
    </section>
    {!selected ? <p className="py-16 text-center text-sm text-zinc-500">Lớp chưa có buổi học trong lịch.</p> : <div className="space-y-8">
      <Section icon={<BookOpen className="h-4 w-4 text-blue-600" />} title={`Bài giảng (${dayLessons.length})`} empty="Chưa có bài giảng cho buổi này.">{dayLessons.map((lesson) => { const file = lesson.materials?.[0]; return <article key={lesson.id} className="border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800"><h3 className="font-medium text-zinc-950 dark:text-zinc-50">{lesson.title}</h3>{lesson.content && <p className="mt-1 text-sm text-zinc-500">{lesson.content}</p>}{file?.storage_path && <Link href={file.storage_path} target="_blank" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="h-4 w-4" />{file.name}<ExternalLink className="h-3.5 w-3.5" /></Link>}</article>;})}</Section>
      <Section icon={<FileText className="h-4 w-4 text-amber-600" />} title={`Bài tập (${dayExercises.length})`} empty="Chưa có bài tập cho buổi này.">{dayExercises.map((exercise) => { const submission = mySubmissions[exercise.id]; const attachment = Array.isArray(exercise.attachments) ? exercise.attachments[0] : null; const overdue = exercise.due_date && new Date(exercise.due_date) < new Date(); return <article key={exercise.id} className="border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-zinc-950 dark:text-zinc-50">{exercise.title}</h3>{exercise.due_date && <span className={`text-xs ${overdue ? 'text-red-600' : 'text-amber-700'}`}><Clock className="mr-1 inline h-3.5 w-3.5" />Hạn {new Date(exercise.due_date).toLocaleString('vi-VN')}</span>}</div>{exercise.description && <p className="mt-1 text-sm text-zinc-500">{exercise.description}</p>}{attachment?.url && <a target="_blank" href={attachment.url} className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"><FileText className="h-4 w-4" />{attachment.name}<ExternalLink className="h-3.5 w-3.5" /></a>}{submission && <div className="mt-3 text-sm"><span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Đã nộp{submission.is_late ? ' · Nộp trễ' : ''}</span>{submission.score !== null && submission.score !== undefined && <span className="ml-3 font-semibold text-blue-700">Điểm {submission.score}/10</span>}{submission.teacher_feedback && <p className="mt-1 text-zinc-500">Nhận xét: {submission.teacher_feedback}</p>}</div>}</div><Button size="sm" onClick={() => setExerciseToSubmit(exercise)} className={submission ? 'border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-700'}><Send className="mr-1.5 h-3.5 w-3.5" />{submission ? 'Cập nhật bài nộp' : 'Nộp bài'}</Button></div></article>;})}</Section>
    </div>}
    <StudentSubmitModal isOpen={!!exerciseToSubmit} onClose={() => setExerciseToSubmit(null)} exercise={exerciseToSubmit} classId={classId} previousSubmission={exerciseToSubmit ? mySubmissions[exerciseToSubmit.id] : null} />
  </div>;
}

function Section({ icon, title, empty, children }: { icon: React.ReactNode; title: string; empty: string; children: React.ReactNode }) { const has = Array.isArray(children) && children.length > 0; return <section><div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">{icon}<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3></div>{has ? children : <p className="py-8 text-sm text-zinc-500">{empty}</p>}</section>; }
