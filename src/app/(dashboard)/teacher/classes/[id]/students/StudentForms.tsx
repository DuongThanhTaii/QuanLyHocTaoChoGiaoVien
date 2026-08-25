'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { enrollStudent, linkParent } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initialEnrollState = { error: '', success: false };
const initialLinkState = { error: '', success: false };

export function EnrollStudentForm({ classId }: { classId: string }) {
  const [state, formAction, isPending] = useActionState(enrollStudent as any, initialEnrollState);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đã thêm học sinh vào lớp!');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thêm học sinh</CardTitle>
        <CardDescription>Thêm học sinh vào lớp bằng email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <div className="space-y-2">
            <Label htmlFor="email">Email học sinh</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="student@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customFee">Học phí tùy chỉnh (Tùy chọn)</Label>
            <Input
              id="customFee"
              name="customFee"
              type="number"
              placeholder="Ví dụ: 100000"
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Đang thêm...' : 'Thêm vào lớp'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function LinkParentForm({ classId, students }: { classId: string, students: any[] }) {
  const [state, formAction, isPending] = useActionState(linkParent as any, initialLinkState);

  useEffect(() => {
    if (state?.success) {
      toast.success('Đã liên kết phụ huynh thành công!');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liên kết Phụ huynh</CardTitle>
        <CardDescription>Cấp quyền cho phụ huynh theo dõi tiến độ học tập.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="classId" value={classId} />
          <div className="space-y-2">
            <Label htmlFor="studentId">Học sinh</Label>
            <select 
              id="studentId" 
              name="studentId" 
              required
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">-- Chọn học sinh --</option>
              {students.map(({ user }) => (
                <option key={user?.id} value={user?.id}>
                  {user?.fullName || user?.email?.value}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentEmail">Email phụ huynh</Label>
            <Input
              id="parentEmail"
              name="parentEmail"
              type="email"
              placeholder="parent@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Đang liên kết...' : 'Liên kết'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
