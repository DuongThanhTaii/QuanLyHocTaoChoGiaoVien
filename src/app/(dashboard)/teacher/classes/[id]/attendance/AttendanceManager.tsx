'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, ShieldAlert, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { markAttendance } from '../../attendance-actions';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

type Student = {
  id: string;
  name: string;
};

type AttendanceManagerProps = {
  classId: string;
  slotId: string;
  students: Student[];
  selectedDateStr: string;
  isScheduled: boolean;
  scheduleDays: number[];
  timeRange: string;
  initialAttendance?: Record<string, { status: string; note: string }>;
};

const statusColors = {
  present: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
  late: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
  absent: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' },
  excused: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' }
};

export function AttendanceManager({ 
  classId, 
  slotId, 
  students, 
  selectedDateStr, 
  isScheduled,
  scheduleDays,
  timeRange, 
  initialAttendance = {} 
}: AttendanceManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string; note: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when initialAttendance changes (e.g. user selected a new date)
  useEffect(() => {
    setAttendanceState(
      students.reduce((acc, s) => {
        const init = initialAttendance[s.id];
        return { ...acc, [s.id]: { status: init?.status || '', note: init?.note || '' } };
      }, {})
    );
  }, [initialAttendance, students]);

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceState(prev => {
      const isCurrentlySelected = prev[studentId]?.status === status;
      return {
        ...prev,
        [studentId]: { ...prev[studentId], status: isCurrentlySelected ? '' : status }
      };
    });
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], note }
    }));
  };

  const markAllPresent = () => {
    const newState: Record<string, { status: string; note: string }> = {};
    students.forEach(s => {
      newState[s.id] = { status: 'present', note: attendanceState[s.id]?.note || '' };
    });
    setAttendanceState(newState);
  };

  const handleSaveAll = async () => {
    const studentsToSave = students.filter(s => attendanceState[s.id]?.status !== '');
    
    if (studentsToSave.length === 0) {
      toast.warning('Chưa chọn học sinh', {
        description: 'Vui lòng đánh dấu điểm danh cho ít nhất một học sinh trước khi lưu.',
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    
    for (const student of studentsToSave) {
      const data = attendanceState[student.id];
      const formData = new FormData();
      formData.append('classId', classId);
      formData.append('slotId', slotId);
      formData.append('studentId', student.id);
      formData.append('status', data.status);
      formData.append('note', data.note);
      
      const res = await markAttendance(formData);
      if (res && res.success) {
        successCount++;
      }
    }
    
    setIsSubmitting(false);
    toast.success('Điểm danh hoàn tất', {
      description: `Đã lưu điểm danh cho ${successCount}/${studentsToSave.length} học sinh.`,
    });
  };

  const StatusButton = ({ studentId, value, icon: Icon, label }: { studentId: string, value: 'present'|'late'|'absent'|'excused', icon: any, label: string }) => {
    const isSelected = attendanceState[studentId]?.status === value;
    const colors = statusColors[value];
    return (
      <button
        type="button"
        onClick={() => handleStatusChange(studentId, value)}
        className={`flex flex-col items-center justify-center p-2 rounded-md border transition-colors w-16 h-14 ${
          isSelected 
            ? `${colors.bg} ${colors.border} ${colors.text}` 
            : 'border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
        }`}
        title={label}
      >
        <Icon className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </button>
    );
  };

  // Generate recent 14 days for the selector
  const recentDays = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    const hasSchedule = scheduleDays.includes(dayOfWeek);
    return {
      dateStr,
      label: format(date, 'EEEE, dd/MM/yyyy', { locale: vi }),
      hasSchedule,
      isToday: i === 0
    };
  });

  // Check if selectedDateStr is in our recentDays list, if not, add it
  if (!recentDays.find(d => d.dateStr === selectedDateStr)) {
    const d = new Date(selectedDateStr);
    recentDays.unshift({
      dateStr: selectedDateStr,
      label: format(d, 'EEEE, dd/MM/yyyy', { locale: vi }),
      hasSchedule: scheduleDays.includes(d.getDay()),
      isToday: false
    });
  }

  const selectedDateObj = new Date(selectedDateStr);
  const formattedSelectedDate = format(selectedDateObj, 'dd/MM/yyyy');

  return (
    <div className="space-y-6">
      {/* NATIVE SELECTOR (Replacing complex Shadcn Select for simplicity in integration) */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Chọn ngày điểm danh</h2>
          <p className="text-sm text-zinc-500 mb-4">Bạn có thể chọn các ngày trong quá khứ để điểm danh bù.</p>
          <div className="flex items-center gap-2 max-w-sm">
            <CalendarIcon className="w-5 h-5 text-zinc-400" />
            <select
              value={selectedDateStr}
              onChange={handleDateChange}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {recentDays.map((day) => (
                <option key={day.dateStr} value={day.dateStr} disabled={day.isToday && !day.hasSchedule && selectedDateStr !== day.dateStr}>
                  {day.label} {day.isToday && !day.hasSchedule ? '(Không có lịch)' : ''} {!day.isToday && !day.hasSchedule ? '(Ngày nghỉ)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!isScheduled ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Ngày <strong>{formattedSelectedDate}</strong> không có trong lịch học cố định. Bạn không thể điểm danh.</span>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900">Điểm danh ngày {formattedSelectedDate}</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={markAllPresent} disabled={isSubmitting || students.length === 0}>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Đánh dấu tất cả Có mặt
              </Button>
              <Button onClick={handleSaveAll} disabled={isSubmitting || students.length === 0}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu điểm danh'}
              </Button>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 rounded-lg flex justify-between items-center border border-zinc-100">
            <div>
              <p className="font-semibold text-zinc-700">Giờ học: {timeRange}</p>
            </div>
          </div>

          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                Chưa có học sinh nào trong lớp
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
                  <div className="font-medium text-zinc-800">{student.name}</div>
                  
                  <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
                    <div className="flex gap-2">
                      <StatusButton studentId={student.id} value="present" icon={CheckCircle2} label="Có mặt" />
                      <StatusButton studentId={student.id} value="late" icon={Clock} label="Đi trễ" />
                      <StatusButton studentId={student.id} value="absent" icon={XCircle} label="Vắng" />
                      <StatusButton studentId={student.id} value="excused" icon={ShieldAlert} label="Có phép" />
                    </div>
                    
                    <Input 
                      type="text" 
                      placeholder="Ghi chú..." 
                      value={attendanceState[student.id]?.note || ''}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      className="w-full md:w-48 h-14"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
