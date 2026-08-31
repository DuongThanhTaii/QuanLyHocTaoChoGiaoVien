'use client';

import { useState } from 'react';
import { Sparkles, Smile, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveSessionEvaluation } from '../../evaluation-actions';
import { toast } from 'sonner';

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
  initialEvaluations = {}
}: EvaluationManagerProps) {
  const [evaluationsState, setEvaluationsState] = useState<Record<string, { rating: string; feedback: string }>>(
    students.reduce((acc, s) => {
      const init = initialEvaluations[s.id];
      return { ...acc, [s.id]: { rating: init?.rating || '', feedback: init?.feedback || '' } };
    }, {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <h2 className="text-lg font-semibold text-zinc-900">Đánh giá buổi học ngày {dateString}</h2>
          <p className="text-sm text-zinc-500">Đánh giá thái độ, kết quả học tập và để lại nhận xét cho phụ huynh.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={markAllGood} disabled={isSubmitting || students.length === 0}>
            <Smile className="w-4 h-4 mr-2 text-green-600" />
            Đánh dấu tất cả Tốt
          </Button>
          <Button onClick={handleSaveAll} disabled={isSubmitting || students.length === 0}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu đánh giá'}
          </Button>
        </div>
      </div>

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
