'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, XCircle, ShieldAlert, AlertCircle, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { markAttendance, createMakeupSession } from '../../attendance-actions';
import { toast } from 'sonner';
import { format, subDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // States for Makeup Session form
  const [makeupStart, setMakeupStart] = useState('19:00');
  const [makeupEnd, setMakeupEnd] = useState('21:00');
  const [makeupNote, setMakeupNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Update local state when initialAttendance changes (e.g. user selected a new date)
  useEffect(() => {
    setAttendanceState(
      students.reduce((acc, s) => {
        const init = initialAttendance[s.id];
        return { ...acc, [s.id]: { status: init?.status || '', note: init?.note || '' } };
      }, {})
    );
  }, [initialAttendance, students]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const newDateStr = format(date, 'yyyy-MM-dd');
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDateStr);
    router.push(`${pathname}?${params.toString()}`);
    setIsCalendarOpen(false);
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

  const handleCreateMakeupSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSession(true);
    
    const formData = new FormData();
    formData.append('classId', classId);
    formData.append('date', selectedDateStr);
    formData.append('startTime', makeupStart);
    formData.append('endTime', makeupEnd);
    formData.append('note', makeupNote);
    
    const res = await createMakeupSession(formData);
    
    setIsCreatingSession(false);
    if (res?.success) {
      toast.success('Tạo buổi học thành công', { description: 'Bây giờ bạn có thể điểm danh.' });
      setIsDialogOpen(false);
      // Force reload to get the new session
      window.location.reload(); 
    } else {
      toast.error('Lỗi', { description: res?.error || 'Không thể tạo buổi học' });
    }
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

  const selectedDateObj = new Date(selectedDateStr);
  const formattedSelectedDate = format(selectedDateObj, 'dd/MM/yyyy');
  const dayName = format(selectedDateObj, 'EEEE', { locale: vi });

  return (
    <div className="space-y-6">
      {/* KHỐI GIAO DIỆN CHÍNH (UNIFIED LAYOUT) */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        
        {/* HEADER AREA */}
        <div className="p-5 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-50/50">
          
          {/* Cụm Bên Trái: Tiêu đề + Nút chọn ngày + Giờ học */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Điểm danh</h2>
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 font-medium shadow-xs",
                    !selectedDateStr && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                  {selectedDateStr ? `${dayName}, ${formattedSelectedDate}` : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={handleDateSelect}
                  locale={vi}
                  initialFocus
                  modifiers={{
                    scheduled: (date) => scheduleDays.includes(date.getDay())
                  }}
                  modifiersStyles={{
                    scheduled: { fontWeight: 'bold', textDecoration: 'underline' }
                  }}
                />
                <div className="p-3 border-t border-zinc-100 bg-zinc-50/50">
                  <p className="text-[11px] text-zinc-500 font-medium">
                    * Ngày in đậm, gạch dưới là ngày có lịch cố định.
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            {isScheduled && (
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                {timeRange}
              </span>
            )}
          </div>

          {/* Cụm Bên Phải: Nút hành động (chỉ hiện khi có lịch) */}
          {isScheduled && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent} disabled={isSubmitting || students.length === 0} className="h-9">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Đánh dấu tất cả Có mặt
              </Button>
              <Button size="sm" onClick={handleSaveAll} disabled={isSubmitting || students.length === 0} className="h-9 shadow-xs">
                {isSubmitting ? 'Đang lưu...' : 'Lưu điểm danh'}
              </Button>
            </div>
          )}
        </div>

        {/* BODY AREA */}
        <div className="p-6">
          {!isScheduled ? (
            // TRẠNG THÁI KHÔNG CÓ LỊCH (EMPTY STATE)
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ngày {formattedSelectedDate} không có lịch</h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6 leading-relaxed">
                Hệ thống không tìm thấy lịch học cố định nào cho ngày này. Nếu bạn có tổ chức dạy bù hoặc học tăng cường, vui lòng khởi tạo buổi học để tiến hành điểm danh.
              </p>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white shadow-xs px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo buổi học
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleCreateMakeupSession}>
                    <DialogHeader>
                      <DialogTitle>Tạo buổi học phát sinh</DialogTitle>
                      <DialogDescription>
                        Tạo buổi học vào ngày {formattedSelectedDate} để có thể điểm danh.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="startTime" className="text-right text-sm font-medium">Bắt đầu</label>
                        <Input id="startTime" type="time" value={makeupStart} onChange={(e) => setMakeupStart(e.target.value)} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="endTime" className="text-right text-sm font-medium">Kết thúc</label>
                        <Input id="endTime" type="time" value={makeupEnd} onChange={(e) => setMakeupEnd(e.target.value)} className="col-span-3" required />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="note" className="text-right text-sm font-medium">Ghi chú</label>
                        <Input id="note" value={makeupNote} onChange={(e) => setMakeupNote(e.target.value)} placeholder="Ví dụ: Dạy bù cho T2" className="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                      <Button type="submit" disabled={isCreatingSession}>{isCreatingSession ? 'Đang tạo...' : 'Lưu buổi học'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            // TRẠNG THÁI CÓ LỊCH -> HIỂN THỊ DANH SÁCH
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 bg-zinc-50 rounded-lg border border-zinc-100 border-dashed">
                  Chưa có học sinh nào trong lớp
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {students.map((student) => (
                    <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4 first:pt-0 last:pb-0 hover:bg-zinc-50/50 transition-colors rounded-lg px-2 -mx-2">
                      <div className="font-semibold text-zinc-800">{student.name}</div>
                      
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
                          className="w-full md:w-48 h-12 text-sm bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
