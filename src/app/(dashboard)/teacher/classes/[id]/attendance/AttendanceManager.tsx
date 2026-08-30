'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { markAttendance } from '../../attendance-actions';
import { toast } from 'sonner';

type Student = {
  id: string;
  name: string;
};

type AttendanceManagerProps = {
  classId: string;
  slotId: string;
  students: Student[];
  dateString: string;
  timeRange: string;
};

const statusColors = {
  present: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700' },
  late: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700' },
  absent: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700' },
  excused: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' }
};

export function AttendanceManager({ classId, slotId, students, dateString, timeRange }: AttendanceManagerProps) {
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string; note: string }>>(
    students.reduce((acc, s) => ({ ...acc, [s.id]: { status: '', note: '' } }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900">Điểm danh ngày {dateString}</h2>
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
  );
}
