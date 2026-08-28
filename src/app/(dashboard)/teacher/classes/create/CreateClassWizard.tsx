'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createClassWizard } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Plus, X } from 'lucide-react';
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
  const [studentContacts, setStudentContacts] = useState<Array<{ email: string; phone: string }>>([]);

  const addStudentContact = () => setStudentContacts((contacts) => [...contacts, { email: '', phone: '' }]);
  const updateStudentContact = (index: number, field: 'email' | 'phone', value: string) => {
    setStudentContacts((contacts) => contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, [field]: value } : contact));
  };

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className={step === 1 ? '' : 'hidden'}>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bước 1: Thông tin chung</CardTitle>
            <CardDescription>Thiết lập tên lớp, môn học và mức học phí cơ bản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" required={step === 1} placeholder="VD: Toán lớp 12" className="bg-white" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Input id="subject" name="subject" placeholder="VD: Toán học" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Nhãn màu</Label>
                <select id="color" name="color" defaultValue="#18181b" className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="#18181b">Đen bóng (Mặc định)</option>
                  <option value="#2563eb">Xanh dương</option>
                  <option value="#16a34a">Xanh lá</option>
                  <option value="#dc2626">Đỏ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Hình thức học phí</Label>
                <select id="feeType" name="feeType" value={feeType} onChange={(event) => setFeeType(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="per_session">Tính theo buổi</option>
                  <option value="per_month">Tính theo tháng (cố định)</option>
                  <option value="per_course">Tính theo khóa học</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feeAmount">Mức học phí (VND) <span className="text-red-500">*</span></Label>
                <Input 
                  id="feeAmount" 
                  name="feeAmount" 
                  type="number" 
                  required={step === 1}
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

            <input type="hidden" name="studentContacts" value={JSON.stringify(studentContacts)} />
            <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Học sinh tham gia ngay</Label>
                  <p className="text-xs text-zinc-500">Thêm học sinh bằng email hoặc số điện thoại (có thể bỏ qua).</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addStudentContact}>
                  <Plus className="size-4" /> Thêm học sinh
                </Button>
              </div>
              {studentContacts.map((contact, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row">
                  <Input type="email" value={contact.email} onChange={(event) => updateStudentContact(index, 'email', event.target.value)} placeholder="Email học sinh" />
                  <Input type="tel" value={contact.phone} onChange={(event) => updateStudentContact(index, 'phone', event.target.value)} placeholder="Số điện thoại học sinh" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Xóa học sinh" onClick={() => setStudentContacts((contacts) => contacts.filter((_, contactIndex) => contactIndex !== index))}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

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
      </div>

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
                        <p>Với lịch linh hoạt, bạn có thể tự thêm, thay đổi ngày giờ, báo nghỉ hoặc học bù cho từng buổi sau khi lớp được tạo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <select id="scheduleType" name="scheduleType" value={scheduleType} onChange={(event) => setScheduleType(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm">
                  <option value="fixed">Lịch cố định hàng tuần (ví dụ: Thứ 2, Thứ 4)</option>
                  <option value="flexible">Lịch linh hoạt (tự thêm từng buổi sau khi tạo lớp)</option>
                  <option value="none">Chưa thiết lập lịch</option>
                </select>
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
                  <p className="text-xs text-zinc-500">Hệ thống sẽ tự động tạo các buổi học dựa trên ngày khai giảng, ngày kết thúc và lịch học này.</p>
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
