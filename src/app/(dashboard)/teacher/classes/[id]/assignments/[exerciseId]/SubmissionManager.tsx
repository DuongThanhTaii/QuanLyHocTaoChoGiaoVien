'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';

const formatSize = (bytes?: number | null) => {
  if (!bytes) return 'Không rõ dung lượng';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${units[index]}`;
};

export function SubmissionManager({ exerciseId, students, submissions }: { exerciseId: string; students: any[]; submissions: any[] }) {
  const [rows, setRows] = useState(submissions);
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>(() => Object.fromEntries(
    submissions.map((submission: any) => [submission.id, { score: submission.score ?? '', feedback: submission.teacher_feedback ?? '' }])
  ));
  const [savingId, setSavingId] = useState<string | null>(null);
  const byStudent = useMemo(() => new Map(rows.map((row: any) => [row.student_id, row])), [rows]);

  const grade = async (submission: any) => {
    const draft = drafts[submission.id] || { score: '', feedback: '' };
    setSavingId(submission.id);
    try {
      const response = await fetch(`/api/teacher/assignments/${exerciseId}/grade`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id, score: draft.score, feedback: draft.feedback }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể lưu điểm');
      setRows((all: any[]) => all.map((row) => row.id === submission.id ? { ...row, score: Number(draft.score), teacher_feedback: draft.feedback } : row));
      toast.success('Đã lưu điểm và nhận xét');
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu điểm');
    } finally {
      setSavingId(null);
    }
  };

  return <div className="space-y-3">{students.map((student) => {
    const submission = byStudent.get(student.id);
    return <section key={student.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{student.full_name}</p><p className="mt-0.5 text-xs text-zinc-500">{submission ? `${submission.is_late ? 'Nộp trễ' : 'Đã nộp'} · ${new Date(submission.submitted_at).toLocaleString('vi-VN')}` : 'Chưa nộp bài'}</p></div>
        {submission ? <Badge className={submission.score === null || submission.score === undefined ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-100' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'}>{submission.score ?? 'Chưa chấm'}{submission.score !== null && submission.score !== undefined ? '/10' : ''}</Badge> : <Badge variant="outline" className="text-zinc-500">Chưa nộp</Badge>}
      </div>
      {submission && <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {submission.note && <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{submission.note}</p>}
        <div className="space-y-1.5">{(submission.submission_assets || []).map((asset: any) => <div key={asset.id} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900"><span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300"><FileText className="mr-1 inline h-3.5 w-3.5 text-blue-600" />{asset.name}{asset.kind !== 'link' && <span className="text-zinc-400"> · {formatSize(asset.size_bytes)}</span>}</span><a className="inline-flex shrink-0 items-center gap-1 font-medium text-blue-600 hover:underline" href={asset.external_url || `/api/teacher/assignments/${exerciseId}/asset/${asset.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />{asset.external_url ? 'Mở link' : 'Xem tệp'}</a></div>)}</div>
        <div className="grid gap-2 sm:grid-cols-[110px_1fr_auto]"><Input value={drafts[submission.id]?.score ?? ''} onChange={(event) => setDrafts((all) => ({ ...all, [submission.id]: { ...all[submission.id], score: event.target.value } }))} type="number" min="0" max="10" step="0.25" placeholder="Điểm /10" /><Textarea value={drafts[submission.id]?.feedback ?? ''} onChange={(event) => setDrafts((all) => ({ ...all, [submission.id]: { ...all[submission.id], feedback: event.target.value } }))} rows={1} placeholder="Nhận xét cho học sinh" /><Button disabled={savingId === submission.id} onClick={() => grade(submission)}>{savingId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu điểm'}</Button></div>
      </div>}
    </section>;
  })}</div>;
}
