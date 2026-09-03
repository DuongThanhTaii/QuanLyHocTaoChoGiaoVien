'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Sparkles, Smile, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveSessionEvaluation } from '../../evaluation-actions';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createMakeupSession } from '../../attendance-actions';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Student = {
  id: string;
  name: string;
};

type EvaluationManagerProps = {
  classId: string;
  sessionId: string;
  students: Student[];
  dateString: string;
  timeRange: string;
  selectedDateStr: string;
  isScheduled: boolean;
  scheduleDays: number[];
  initialEvaluations?: Record<string, { rating: string; feedback: string }>;
};

const ratingColors: Record<string, { bg: string; border: string; text: string }> = {
  EXCELLENT: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
  GOOD: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
  AVERAGE: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
  POOR: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' }
};

export function EvaluationManager({
  classId,
  sessionId,
  students,
  dateString,
  timeRange,
  selectedDateStr,
  isScheduled,
  scheduleDays,
  initialEvaluations = {}
}: EvaluationManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [makeupStart, setMakeupStart] = useState('19:00');
  const [makeupEnd, setMakeupEnd] = useState('21:00');
  const [makeupNote, setMakeupNote] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [evaluationsState, setEvaluationsState] = useState<Record<string, { rating: string; feedback: string }>>(
    students.reduce((acc, s) => {
      const init = initialEvaluations[s.id];
      return { ...acc, [s.id]: { rating: init?.rating || '', feedback: init?.feedback || '' } };
    }, {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDate = new Date(selectedDateStr);
  const formattedDate = format(selectedDate, 'dd/MM/yyyy');
  const dayName = format(selectedDate, 'EEEE', { locale: vi });
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(date, 'yyyy-MM-dd'));
    router.push(`${pathname}?${params.toString()}`);
    setIsCalendarOpen(false);
  };
  const handleCreateMakeupSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingSession(true);
    const formData = new FormData();
    formData.append('classId', classId); formData.append('date', selectedDateStr);
    formData.append('startTime', makeupStart); formData.append('endTime', makeupEnd); formData.append('note', makeupNote);
    const result = await createMakeupSession(formData);
    setIsCreatingSession(false);
    if (result?.success) { toast.success('Tạo buổi học bù thành công'); setIsDialogOpen(false); window.location.reload(); }
    else toast.error('Không thể tạo buổi học', { description: result?.error });
  };

  const handleRatingChange = (studentId: string, rating: string) => {
    setEvaluationsState(prev => {
      const isCurrentlySelected = prev[studentId]?.rating === rating;
      return {
        ...prev,
        [studentId]: { ...prev[studentId], rating: isCurrentlySelected ? '' : rating }
      };
    });
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setEvaluationsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], feedback }
    }));
  };

  const markAllGood = () => {
    const newState: Record<string, { rating: string; feedback: string }> = {};
    students.forEach(s => {
      newState[s.id] = { rating: 'GOOD', feedback: evaluationsState[s.id]?.feedback || '' };
    });
    setEvaluationsState(newState);
    toast.info('Đã chọn mức "Tốt" cho toàn bộ học sinh');
  };

  const handleSaveAll = async () => {
    const studentsToSave = students.filter(s => evaluationsState[s.id]?.rating !== '');

    if (studentsToSave.length === 0) {
      toast.warning('Chưa chọn đánh giá', {
        description: 'Vui lòng chọn mức độ đánh giá cho ít nhất một học sinh trước khi lưu.',
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorOccurred = false;

    for (const student of studentsToSave) {
      const data = evaluationsState[student.id];
      const formData = new FormData();
      formData.append('classId', classId);
      formData.append('sessionId', sessionId);
      formData.append('studentId', student.id);
      formData.append('rating', data.rating);
      formData.append('feedback', data.feedback);

      const res = await saveSessionEvaluation(formData);
      if (res && res.success) {
        successCount++;
      } else {
        errorOccurred = true;
        if (res?.error) {
          toast.error(`Lỗi lưu đánh giá cho ${student.name}: ${res.error}`);
        }
      }
    }

    setIsSubmitting(false);
    if (successCount > 0) {
      toast.success('Đã lưu đánh giá thành công', {
        description: `Đã cập nhật đánh giá cho ${successCount}/${studentsToSave.length} học sinh và gửi thông báo đến phụ huynh.`,
      });
    }
  };

  const RatingButton = ({
    studentId,
    value,
    icon: Icon,
    label
  }: {
    studentId: string;
    value: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    icon: any;
    label: string;
  }) => {
    const isSelected = evaluationsState[studentId]?.rating === value;
    const colors = ratingColors[value];
    return (
      <button
        type="button"
        onClick={() => handleRatingChange(studentId, value)}
        className={`flex flex-col items-center justify-center p-1 rounded-md border transition-colors w-[74px] h-14 ${
          isSelected
            ? `${colors.bg} ${colors.border} ${colors.text}`
            : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
        }`}
        title={label}
      >
        <Icon className="w-5 h-5 mb-0.5 shrink-0" />
        <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">Đánh giá buổi học</h2>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-9 font-medium"><Calendar className="mr-2 h-4 w-4" />{dayName}, {formattedDate}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} locale={vi} modifiers={{ scheduled: (date) => scheduleDays.includes(date.getDay()) }} modifiersStyles={{ scheduled: { fontWeight: 'bold', textDecoration: 'underline' } }} /></PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-zinc-500">Đánh giá thái độ, kết quả học tập và để lại nhận xét cho phụ huynh.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={markAllGood} disabled={isSubmitting || students.length === 0}>
            <Smile className="w-4 h-4 mr-2 text-green-600" />
            Đánh dấu tất cả Tốt
          </Button>
          <Button onClick={handleSaveAll} disabled={isSubmitting || students.length === 0 || !sessionId}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
          </Button>
        </div>
      </div>

      {!isScheduled && !sessionId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          <p className="font-semibold">Ngày {formattedDate} không có lịch cố định</p>
          <p className="mt-1 text-amber-800">Bạn có thể tạo buổi học bù để đánh giá học sinh cho ngày này.</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="mt-3 bg-amber-600 text-white hover:bg-amber-700">Tạo buổi học bù</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[425px]"><form onSubmit={handleCreateMakeupSession}><DialogHeader><DialogTitle>Tạo buổi học bù</DialogTitle><DialogDescription>Khởi tạo buổi học để đánh giá cho ngày {formattedDate}.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><label className="grid grid-cols-4 items-center gap-4 text-sm font-medium">Bắt đầu<Input type="time" value={makeupStart} onChange={(e) => setMakeupStart(e.target.value)} className="col-span-3" required /></label><label className="grid grid-cols-4 items-center gap-4 text-sm font-medium">Kết thúc<Input type="time" value={makeupEnd} onChange={(e) => setMakeupEnd(e.target.value)} className="col-span-3" required /></label><label className="grid grid-cols-4 items-center gap-4 text-sm font-medium">Ghi chú<Input value={makeupNote} onChange={(e) => setMakeupNote(e.target.value)} placeholder="Ví dụ: Dạy bù cho T2" className="col-span-3" /></label></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button><Button type="submit" disabled={isCreatingSession}>{isCreatingSession ? 'Đang tạo...' : 'Lưu buổi học'}</Button></DialogFooter></form></DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-zinc-50 p-4 rounded-lg flex justify-between items-center border border-zinc-100">
        <div>
          <p className="font-semibold text-zinc-700">Ngày: {dateString}</p>
          <p className="text-sm text-zinc-500">Giờ học: {timeRange}</p>
        </div>
      </div>

      <div className="space-y-4">
        {students.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            Chưa có học sinh nào trong lớp
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-zinc-100 pb-4 gap-4"
            >
              <div className="min-w-[160px]">
                <div className="font-medium text-zinc-800">{student.name}</div>
                <div className="text-xs text-zinc-400">
                  {evaluationsState[student.id]?.rating ? (
                    <span className="text-green-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Đã chọn mức
                    </span>
                  ) : (
                    <span className="text-zinc-400 mt-0.5">Chưa đánh giá</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center flex-1 justify-end">
                <div className="flex gap-2">
                  <RatingButton studentId={student.id} value="EXCELLENT" icon={Sparkles} label="Xuất sắc" />
                  <RatingButton studentId={student.id} value="GOOD" icon={Smile} label="Tốt" />
                  <RatingButton studentId={student.id} value="AVERAGE" icon={AlertCircle} label="Cần cố gắng" />
                  <RatingButton studentId={student.id} value="POOR" icon={AlertTriangle} label="Chưa tập trung" />
                </div>

                <Input
                  type="text"
                  placeholder="Ghi chú, nhận xét cho phụ huynh..."
                  value={evaluationsState[student.id]?.feedback || ''}
                  onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                  className="w-full sm:w-72 lg:w-80 h-14"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
