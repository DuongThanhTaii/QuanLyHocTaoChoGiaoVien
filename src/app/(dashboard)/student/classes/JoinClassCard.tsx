'use client';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { joinClassByCode } from '@/app/(dashboard)/teacher/classes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function JoinClassCard() {
  const [state, action, pending] = useActionState(joinClassByCode as any, { error: '' });
  useEffect(() => { if (state?.error) toast.error(state.error); }, [state]);
  return <form action={action} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5"><div><h2 className="font-semibold">Vào lớp học</h2><p className="text-sm text-zinc-500">Dán link mời hoặc nhập mã lớp do giáo viên cung cấp.</p></div><div className="space-y-2"><Label htmlFor="class-code">Link hoặc mã lớp</Label><Input id="class-code" name="code" placeholder="Ví dụ: AB12CD hoặc https://.../join/AB12CD" required /></div><Button type="submit" disabled={pending}>{pending ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu vào lớp'}</Button><p className="text-xs text-zinc-500">Giáo viên cần duyệt yêu cầu trước khi bạn vào lớp.</p></form>;
}
