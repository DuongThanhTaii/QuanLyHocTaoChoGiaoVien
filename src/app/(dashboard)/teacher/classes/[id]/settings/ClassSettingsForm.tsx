'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateClassSettings } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Pencil, Check, X } from 'lucide-react';

export function ClassSettingsForm({ classroom }: { classroom: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateClassSettings as any, {
    error: '',
    success: false,
  });

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success('Đã lưu thông tin lớp học.');
      setIsEditing(false);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="classId" value={classroom.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Tên lớp</Label>
          <Input
            id="name"
            name="name"
            defaultValue={classroom.name}
            required
            disabled={!isEditing}
            className="disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Môn học</Label>
          <Input
            id="subject"
            name="subject"
            defaultValue={classroom.subject ?? ''}
            disabled={!isEditing}
            className="disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={classroom.description ?? ''}
          disabled={!isEditing}
          className="disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40 resize-none min-h-[80px]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="feeAmount">Học phí (VNĐ)</Label>
          <Input
            id="feeAmount"
            name="feeAmount"
            type="number"
            min="0"
            defaultValue={classroom.fee_per_session ?? 0}
            required
            disabled={!isEditing}
            className="disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feeType">Cách tính</Label>
          <select
            id="feeType"
            name="feeType"
            defaultValue={classroom.fee_type}
            disabled={!isEditing}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40"
          >
            <option value="per_session">Theo buổi</option>
            <option value="per_month">Theo tháng</option>
            <option value="per_course">Theo khóa</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Màu nhãn</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={classroom.color ?? '#18181b'}
            disabled={!isEditing}
            className="h-9 p-1 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {!isEditing ? (
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            className="gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              disabled={pending}
              className="gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={pending}
              className="gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Hủy
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
