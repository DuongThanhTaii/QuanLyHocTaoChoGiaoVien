'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { joinClassByCode } from '@/app/(dashboard)/teacher/classes/actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function JoinButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Đang tham gia...' : 'Tham gia lớp học'}</Button>;
}

export function JoinClassForm({ code }: { code: string }) {
  const [state, formAction] = useActionState(joinClassByCode as any, { error: '' });

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="code" value={code} />
      <JoinButton />
    </form>
  );
}
