'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { addStudentManual, updateStudent } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialEnrollState = { error: '', success: false };
const initialLinkState = { error: '', success: false };

export function EnrollStudentForm({ classId }: { classId: string }) {
  const [state, formAction, isPending] = useActionState(addStudentManual as any, initialEnrollState);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đã thêm học sinh vào lớp!');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="bg-white p-6 rounded-lg border border-zinc-200">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="classId" value={classId} />
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên học sinh <span className="text-red-500">*</span></Label>
          <Input id="fullName" name="fullName" placeholder="Nguyễn Văn A" required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" name="phone" placeholder="09xxxx (Tùy chọn)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="email@ (Tùy chọn)" />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full mt-2">
          {isPending ? 'Đang thêm...' : 'Thêm học sinh'}
        </Button>
      </form>
    </div>
  );
}

const initialEditState = { error: '', success: false };

export function EditStudentForm({ classId, student, onSuccess }: { classId: string, student: any, onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(updateStudent as any, initialEditState);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đã cập nhật thông tin học sinh!');
      if (onSuccess) onSuccess();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  return (
    <div className="bg-white rounded-lg">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="studentId" value={student.id} />
        
        <div className="space-y-2">
          <Label htmlFor={`edit-fullName-${student.id}`}>Họ và tên học sinh <span className="text-red-500">*</span></Label>
          <Input id={`edit-fullName-${student.id}`} name="fullName" defaultValue={student.full_name} required />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-phone-${student.id}`}>Số điện thoại</Label>
            <Input id={`edit-phone-${student.id}`} name="phone" defaultValue={student.phone || ''} placeholder="09xxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-email-${student.id}`}>Email</Label>
            <Input id={`edit-email-${student.id}`} name="email" type="email" defaultValue={student.email || ''} placeholder="email@" />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full mt-2">
          {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </form>
    </div>
  );
}
