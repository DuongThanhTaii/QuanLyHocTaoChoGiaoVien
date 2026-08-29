'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateClassInvitationCode } from '../../actions';
import { toast } from 'sonner';

export function GenerateInvitationButton({ classId }: { classId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateClassInvitationCode(classId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Đã tạo mã lớp thành công');
    }
    setIsLoading(false);
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? 'Đang tạo...' : 'Tạo mã mới'}
    </Button>
  );
}
