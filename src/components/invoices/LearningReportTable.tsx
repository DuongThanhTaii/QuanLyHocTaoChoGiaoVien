import { Badge } from '@/components/ui/badge';

const attendanceLabel: Record<string, string> = { present: 'Có mặt', late: 'Đi trễ', absent: 'Vắng', excused: 'Có phép', not_marked: 'Chưa điểm danh' };
const attendanceStyle: Record<string, string> = {
  present: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  late: 'border-amber-200 bg-amber-50 text-amber-700',
  absent: 'border-rose-200 bg-rose-50 text-rose-700',
  excused: 'border-violet-200 bg-violet-50 text-violet-700',
  not_marked: 'border-zinc-200 bg-zinc-50 text-zinc-600',
};
const ratingLabel: Record<string, string> = { EXCELLENT: 'Xuất sắc', GOOD: 'Tốt', AVERAGE: 'Cần cố gắng', POOR: 'Chưa tập trung' };

export function LearningReportTable({ sessions }: { sessions: any[] }) {
  const badge = (status: string) => <Badge variant="outline" className={`whitespace-nowrap ${attendanceStyle[status] || attendanceStyle.not_marked}`}>{attendanceLabel[status] || 'Chưa điểm danh'}</Badge>;

  return <div className="learning-report-table-v2">
    <div className="hidden overflow-x-auto rounded-xl border border-orange-200 md:block print:block">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-orange-500 text-white"><tr>{['STT', 'Ngày', 'Nội dung', 'BTVN', 'Ý thức', 'Nhận xét', 'Chuyên cần', 'Ghi chú'].map((label) => <th key={label} className="h-11 px-3 text-center text-xs font-bold">{label}</th>)}</tr></thead>
        <tbody>{sessions.map((session, index) => <tr key={`${session.date}-${index}`} className="align-top border-t border-orange-100 even:bg-orange-50/70"><td className="px-3 py-3 text-center font-semibold">Buổi {index + 1}</td><td className="min-w-28 px-3 py-3 text-xs"><b>{new Date(`${session.date}T00:00:00`).toLocaleDateString('vi-VN')}</b><br />{session.startTime?.slice(0, 5)}–{session.endTime?.slice(0, 5)}</td><td className="min-w-52 whitespace-pre-line px-3 py-3">{session.learningContent || 'Chưa cập nhật nội dung.'}</td><td className="min-w-36 px-3 py-3">{session.exercises?.length ? session.exercises.map((exercise: any) => <p key={exercise.title}>• {exercise.title}</p>) : '—'}</td><td className="min-w-28 px-3 py-3 text-center">{session.rating ? ratingLabel[session.rating] || session.rating : '—'}</td><td className="min-w-56 whitespace-pre-line px-3 py-3">{session.feedback || 'Chưa có nhận xét.'}</td><td className="min-w-32 px-3 py-3 text-center">{badge(session.attendanceStatus)}</td><td className="min-w-40 whitespace-pre-line px-3 py-3 text-zinc-600">{session.attendanceNote || '—'}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="space-y-3 md:hidden print:hidden">{sessions.map((session, index) => <details key={`${session.date}-${index}`} className="rounded-xl border border-orange-100 p-4" open={index === 0}><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3"><span className="font-semibold">Buổi {index + 1} · {new Date(`${session.date}T00:00:00`).toLocaleDateString('vi-VN')}</span>{badge(session.attendanceStatus)}</summary><div className="mt-3 space-y-3 border-t pt-3 text-sm leading-6 text-zinc-600"><p><b className="text-zinc-900">Nội dung:</b> {session.learningContent || 'Chưa cập nhật nội dung buổi học.'}</p><p><b className="text-zinc-900">Bài tập:</b> {session.exercises?.length ? session.exercises.map((exercise: any) => exercise.title).join(', ') : 'Chưa giao bài tập.'}</p><p><b className="text-zinc-900">Đánh giá:</b> {session.rating ? ratingLabel[session.rating] || session.rating : 'Chưa đánh giá'}{session.feedback ? ` — ${session.feedback}` : ''}</p><p><b className="text-zinc-900">Ghi chú:</b> {session.attendanceNote || '—'}</p></div></details>)}</div>
  </div>;
}
