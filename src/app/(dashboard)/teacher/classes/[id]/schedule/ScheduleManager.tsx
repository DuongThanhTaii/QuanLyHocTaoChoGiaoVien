'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { addScheduleSlot, deleteScheduleSlot } from './actions';
import { toast } from 'sonner';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Đang thêm...' : (
        <>
          <Plus className="h-4 w-4 mr-2" /> Thêm lịch học
        </>
      )}
    </Button>
  );
}

export function ScheduleManager({ classId, slots, className }: { classId: string, slots: any[], className?: string }) {
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
    if (confirm('Bạn có chắc chắn muốn xóa lịch học này?')) {
      try {
        const formData = new FormData();
        formData.append('slotId', slotId);
        formData.append('classId', classId);
        await deleteScheduleSlot(null, formData);
        toast.success('Đã xóa lịch học');
      } catch (err) {
        toast.error('Có lỗi xảy ra khi xóa');
      }
    }
  };

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
                            <button 
                              onClick={() => handleDelete(slotId)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                              title="Xóa"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
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
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <input type="hidden" name="classId" value={classId} />
            
            <div className="space-y-2">
              <Label>Thứ trong tuần</Label>
              <Select name="dayOfWeek" defaultValue="1" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn thứ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Thứ 2</SelectItem>
                  <SelectItem value="2">Thứ 3</SelectItem>
                  <SelectItem value="3">Thứ 4</SelectItem>
                  <SelectItem value="4">Thứ 5</SelectItem>
                  <SelectItem value="5">Thứ 6</SelectItem>
                  <SelectItem value="6">Thứ 7</SelectItem>
                  <SelectItem value="0">Chủ Nhật</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Giờ bắt đầu</Label>
              <Input type="time" name="startTime" required className="w-full" />
            </div>
            
            <div className="space-y-2">
              <Label>Giờ kết thúc</Label>
              <Input type="time" name="endTime" required className="w-full" />
            </div>
            
            <div className="w-full">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
