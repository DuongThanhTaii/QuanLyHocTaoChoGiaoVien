'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createClassWizard } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-zinc-900 text-white hover:bg-zinc-800">
      {pending ? 'Đang tạo...' : 'Tạo lớp học'}
    </Button>
  );
}

export function CreateClassWizard() {
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState(createClassWizard as any, { error: '' });

  const [feeType, setFeeType] = useState('per_session');
  const [scheduleType, setScheduleType] = useState('fixed');

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {step === 1 && (
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bước 1: Thông tin chung</CardTitle>
            <CardDescription>Thiết lập tên lớp, môn học và mức học phí cơ bản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" required placeholder="VD: Machine Learning Cơ Bản" className="bg-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Input id="subject" name="subject" placeholder="VD: Toán học" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Nhãn màu</Label>
                <Select name="color" defaultValue="#18181b">
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn màu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#18181b">Đen bóng (Mặc định)</SelectItem>
                    <SelectItem value="#2563eb">Xanh dương</SelectItem>
                    <SelectItem value="#16a34a">Xanh lá</SelectItem>
                    <SelectItem value="#dc2626">Đỏ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Hình thức học phí</Label>
                <Select name="feeType" value={feeType} onValueChange={(val) => setFeeType(val || '')}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Chọn hình thức tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_session">Tính theo buổi</SelectItem>
                    <SelectItem value="per_month">Tính theo tháng (Cố định)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeAmount">Mức học phí (VND) <span className="text-red-500">*</span></Label>
                <Input 
                  id="feeAmount" 
                  name="feeAmount" 
                  type="number" 
                  required 
                  min="0" 
                  step="1000" 
                  placeholder="150000" 
                  className="bg-white"
                />
              </div>
            </div>
            {feeType === 'per_month' && (
              <p className="text-xs text-zinc-500 italic">
                * Học phí tính theo tháng sẽ yêu cầu tạo hóa đơn thủ công hoặc tạo mẫu thanh toán định kỳ.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả lớp học</Label>
              <Textarea id="description" name="description" placeholder="Ghi chú thêm về lớp học..." className="bg-white" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-zinc-100 pt-6">
            <Link href="/teacher/classes" className="text-sm text-zinc-500 hover:text-zinc-900">
              Hủy
            </Link>
            <Button type="button" onClick={() => setStep(2)} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              Tiếp tục
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bước 2: Lịch học dự kiến</CardTitle>
            <CardDescription>Thiết lập thời gian bắt đầu và hình thức xếp lịch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Thời gian khai giảng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Khai giảng (Ngày bắt đầu) <span className="text-red-500">*</span></Label>
                <Input id="startDate" name="startDate" type="date" required className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Dự kiến kết thúc (Tùy chọn)</Label>
                <Input id="endDate" name="endDate" type="date" className="bg-white" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="scheduleType">Kiểu lịch học</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button" className="inline-flex items-center justify-center">
                        <Info className="w-4 h-4 text-red-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Hệ thống quản lý lịch học dạng linh hoạt (Session-based). Bạn có thể dễ dàng thay đổi ngày giờ, hoặc báo nghỉ, học bù cho từng buổi học cụ thể sau khi lớp được tạo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select name="scheduleType" value={scheduleType} onValueChange={(val) => setScheduleType(val || '')}>
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="Chọn kiểu lịch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Lịch cố định hàng tuần (VD: T2, T4)</SelectItem>
                    <SelectItem value="flexible">Lịch linh hoạt (Tùy biến mỗi tuần)</SelectItem>
                    <SelectItem value="none">Chưa thiết lập</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === 'fixed' && (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-zinc-800">Chọn lịch học cố định hàng tuần</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Dummy Schedule Selector for now. A robust one would need a complex UI or checkboxes */}
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day) => (
                      <label key={day} className="flex items-center gap-2 text-sm bg-white p-2 border border-zinc-200 rounded cursor-pointer hover:border-zinc-300">
                        <input type="checkbox" name="weekDays" value={day} className="rounded text-zinc-900 focus:ring-zinc-900" />
                        {day}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Giờ bắt đầu</Label>
                      <Input type="time" name="startTime" defaultValue="18:00" className="bg-white" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Thời lượng (Phút)</Label>
                      <Input type="number" name="durationMinutes" defaultValue="90" step="15" className="bg-white" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Hệ thống sẽ tự động sinh các buổi học (sessions) dựa trên khoảng thời gian khai giảng - kết thúc và lịch học này.</p>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t border-zinc-100 pt-6">
            <Button type="button" onClick={() => setStep(1)} variant="outline">
              Quay lại
            </Button>
            <SubmitButton />
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
