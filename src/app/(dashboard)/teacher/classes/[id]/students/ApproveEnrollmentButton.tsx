'use client';
import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { approveEnrollment } from '../../actions';
export function ApproveEnrollmentButton({ enrollmentId, classId }: { enrollmentId: string; classId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await approveEnrollment(enrollmentId, classId); result.error ? toast.error(result.error) : toast.success('Đã duyệt học sinh vào lớp.'); })}><Check className="mr-1 size-4" />{pending ? 'Đang duyệt' : 'Duyệt'}</Button>;
}
