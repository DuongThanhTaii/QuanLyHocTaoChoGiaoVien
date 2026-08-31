'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { addScheduleSlot, deleteScheduleSlot } from './actions';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto" style={{ height: '40px' }}>
      {pending ? 'Đang thêm...' : (
        <>
          <Plus className="h-4 w-4 mr-2" /> Thêm lịch học
        </>
      )}
    </Button>
  );
}

function TimePicker({ name, required }: { name: string, required?: boolean }) {
  const [hour, setHour] = useState("18");
  const [minute, setMinute] = useState("00");
  
  return (
    <div className="flex gap-1 items-center w-full">
      <input type="hidden" name={name} value={`${hour}:${minute}`} />
      <Select value={hour} onValueChange={(val) => val && setHour(val)} required={required}>
        <SelectTrigger className="w-[70px] px-2 text-sm border-input bg-transparent rounded-md shadow-sm" style={{ height: '40px' }}>
          <span className="flex items-center gap-2 font-semibold">{hour}</span>
        </SelectTrigger>
        <SelectContent className="min-w-[70px] max-h-[200px]">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = i.toString().padStart(2, '0');
            return <SelectItem key={h} value={h}>{h}</SelectItem>;
          })}
        </SelectContent>
      </Select>
      <span className="text-zinc-500 font-medium">:</span>
      <Select value={minute} onValueChange={(val) => val && setMinute(val)} required={required}>
        <SelectTrigger className="w-[70px] px-2 text-sm border-input bg-transparent rounded-md shadow-sm" style={{ height: '40px' }}>
          <span className="flex items-center gap-2 font-semibold">{minute}</span>
        </SelectTrigger>
        <SelectContent className="min-w-[70px] max-h-[200px]">
          {Array.from({ length: 12 }).map((_, i) => {
            const m = (i * 5).toString().padStart(2, '0');
            return <SelectItem key={m} value={m}>{m}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ScheduleManager({ classId, slots, className }: { classId: string, slots: any[], className?: string }) {
  const [selectedDay, setSelectedDay] = useState("1");
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

  const days = [
    { label: 'Thứ 2', index: 1 },
    { label: 'Thứ 3', index: 2 },
    { label: 'Thứ 4', index: 3 },
    { label: 'Thứ 5', index: 4 },
    { label: 'Thứ 6', index: 5 },
    { label: 'Thứ 7', index: 6 },
    { label: 'Chủ Nhật', index: 0 },
  ];

  const handleDelete = async (slotId: string) => {
    try {
      const formData = new FormData();
      formData.append('slotId', slotId);
      formData.append('classId', classId);
      await deleteScheduleSlot(null, formData);
      toast.success('Đã xóa lịch học');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xóa');
    }
  };

  const selectedDayLabel = days.find(d => d.index.toString() === selectedDay)?.label || "Chọn thứ";

  return (
    <div className="space-y-6">
      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
            {days.map((day) => {
              const daySlots = slots.filter((s: any) => (s._dayOfWeek ?? s.dayOfWeek) === day.index);
              
              return (
                <div key={day.label} className="border border-zinc-200 rounded-lg p-3 min-h-[120px] bg-zinc-50/50 flex flex-col">
                  <div className="font-semibold text-center border-b border-zinc-200 pb-2 mb-3 text-zinc-700 text-sm">{day.label}</div>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    {daySlots.length === 0 ? (
                      <span className="text-xs text-zinc-400 text-center m-auto italic">Trống</span>
                    ) : (
                      daySlots.map((slot: any) => {
                        const slotId = slot._id || slot.id;
                        return (
                          <div key={slotId} className="group relative bg-white border border-blue-100 shadow-sm text-blue-800 text-xs p-2 rounded-md text-center transition-all hover:border-blue-300">
                            <div className="font-medium">
                              {(slot._startTime || slot.startTime).substring(0, 5)} - {(slot._endTime || slot.endTime).substring(0, 5)}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger 
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                                title="Xóa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa lịch học này không?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(slotId)}>Đồng ý xóa</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Thêm lịch học</CardTitle>
          <CardDescription>Thêm khoảng thời gian học định kỳ hàng tuần</CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            action={async (formData) => {
              const res = await addScheduleSlot(null, formData);
              if (res?.error) {
                toast.error(res.error);
              } else {
                toast.success('Đã thêm lịch học!');
              }
            }} 
            className="flex flex-col md:flex-row gap-4 items-end w-full"
          >
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="dayOfWeek" value={selectedDay} />
            
            <div className="space-y-2 w-full md:flex-1">
              <Label>Thứ trong tuần</Label>
              <div>
                <Select value={selectedDay} onValueChange={(val) => val && setSelectedDay(val)} required>
                  <SelectTrigger className="w-full text-sm border-input bg-transparent rounded-md shadow-sm" style={{ height: '40px' }}>
                    <span className="flex items-center gap-2 font-semibold">{selectedDayLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d.index} value={d.index.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-end justify-start md:justify-center gap-4 w-full md:flex-[1.5]">
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <TimePicker name="startTime" required />
              </div>
              <div className="mb-2.5 text-zinc-400 font-medium">-</div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <TimePicker name="endTime" required />
              </div>
            </div>
            
            <div className="w-full md:flex-1 flex md:justify-end">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
