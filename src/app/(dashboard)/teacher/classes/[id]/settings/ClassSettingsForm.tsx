'use client';
import { useActionState, useEffect } from 'react';
import { updateClassSettings } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function ClassSettingsForm({ classroom }: { classroom: any }) {
  const [state, action, pending] = useActionState(updateClassSettings as any, { error: '', success: false });
  useEffect(() => { if (state?.error) toast.error(state.error); if (state?.success) toast.success('Đã lưu thông tin lớp học.'); }, [state]);
  return <form action={action} className="space-y-4"><input type="hidden" name="classId" value={classroom.id} />
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Tên lớp</Label><Input name="name" defaultValue={classroom.name} required /></div><div className="space-y-2"><Label>Môn học</Label><Input name="subject" defaultValue={classroom.subject ?? ''} /></div></div>
    <div className="space-y-2"><Label>Mô tả</Label><Textarea name="description" defaultValue={classroom.description ?? ''} /></div>
    <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Học phí</Label><Input name="feeAmount" type="number" min="0" defaultValue={classroom.fee_per_session ?? 0} required /></div><div className="space-y-2"><Label>Cách tính</Label><select name="feeType" defaultValue={classroom.fee_type} className="h-9 w-full rounded-lg border px-3 text-sm"><option value="per_session">Theo buổi</option><option value="per_month">Theo tháng</option><option value="per_course">Theo khóa</option></select></div><div className="space-y-2"><Label>Màu nhãn</Label><Input name="color" type="color" defaultValue={classroom.color ?? '#18181b'} /></div></div>
    <Button type="submit" disabled={pending}>{pending ? 'Đang lưu...' : 'Lưu thay đổi'}</Button></form>;
}
