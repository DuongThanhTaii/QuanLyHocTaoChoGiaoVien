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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Input id="subject" name="subject" placeholder="VD: Toán học" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feePerSession">Học phí / Buổi (VND) <span className="text-red-500">*</span></Label>
                <Input 
                  id="feePerSession" 
                  name="feePerSession" 
                  type="number" 
                  required 
                  min="0" 
                  step="1000" 
                  placeholder="150000" 
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả lớp học</Label>
              <Textarea id="description" name="description" placeholder="Ghi chú thêm về lớp học..." className="bg-white" />
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
          </CardContent>
          <CardFooter className="flex justify-between border-t border-zinc-100 pt-6">
            <Link href="/teacher/classes" className="text-sm text-zinc-500 hover:text-zinc-900">
              Hủy
            </Link>
            <Button type="button" onClick={() => setStep(2)} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              Tiếp tục &rarr;
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bước 2: Lịch học dự kiến</CardTitle>
            <CardDescription>Chọn hình thức lịch học (Bạn có thể thiết lập chi tiết sau).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleType">Kiểu lịch học</Label>
              <Select name="scheduleType" defaultValue="fixed">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn kiểu lịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Lịch cố định (Ví dụ: Thứ 2, Thứ 4)</SelectItem>
                  <SelectItem value="flexible">Lịch linh hoạt (Tùy biến mỗi tuần)</SelectItem>
                  <SelectItem value="none">Chưa thiết lập</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-zinc-500 p-4 bg-zinc-50 rounded border border-zinc-100">
              Lưu ý: Hệ thống quản lý lịch học dạng linh hoạt (Session-based). Bạn có thể dễ dàng thay đổi ngày giờ, hoặc báo nghỉ, học bù cho từng buổi học cụ thể sau khi lớp được tạo.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-zinc-100 pt-6">
            <Button type="button" onClick={() => setStep(1)} variant="outline">
              &larr; Quay lại
            </Button>
            <SubmitButton />
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
