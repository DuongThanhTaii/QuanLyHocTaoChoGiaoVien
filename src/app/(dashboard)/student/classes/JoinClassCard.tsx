'use client';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { joinClassByCode } from '@/app/(dashboard)/teacher/classes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export function JoinClassCard() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(joinClassByCode as any, { error: '', success: '' });
  useEffect(() => { if (state?.error) toast.error(state.error); if (state?.success) { toast.success(state.success); setOpen(false); } }, [state]);
  return <><Button type="button" size="sm" onClick={() => setOpen(true)}>+ Vào lớp</Button>{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><form action={action} className="relative w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"><Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => setOpen(false)} aria-label="Đóng"><X className="h-4 w-4" /></Button><div><h2 className="text-lg font-semibold">Vào lớp học</h2><p className="mt-1 text-sm text-zinc-500">Dán link mời hoặc nhập mã lớp do giáo viên cung cấp.</p></div><div className="space-y-2"><Label htmlFor="class-code">Link hoặc mã lớp</Label><Input id="class-code" name="code" placeholder="Ví dụ: AB12CD hoặc https://.../join/AB12CD" required /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={pending}>{pending ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button></div><p className="text-xs text-zinc-500">Giáo viên cần duyệt yêu cầu trước khi bạn vào lớp.</p></form></div>}</>;
}
