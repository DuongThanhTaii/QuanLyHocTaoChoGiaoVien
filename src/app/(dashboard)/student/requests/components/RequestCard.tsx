'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { respondToLinkRequest } from '@/app/actions/link-requests';
import { toast } from 'sonner';

export function RequestCard({ request }: { request: any }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleResponse(accept: boolean) {
    setIsLoading(true);
    try {
      const result = await respondToLinkRequest(request.id, accept);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(accept ? 'Đã chấp nhận liên kết' : 'Đã từ chối liên kết');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yêu cầu liên kết tài khoản</CardTitle>
        <CardDescription>
          Phụ huynh có email <strong>{Array.isArray(request.profiles) ? request.profiles[0]?.email : request.profiles?.email}</strong> muốn liên kết với tài khoản của bạn để theo dõi tiến độ học tập.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => handleResponse(false)} disabled={isLoading}>
          Từ chối
        </Button>
        <Button onClick={() => handleResponse(true)} disabled={isLoading}>
          Chấp nhận
        </Button>
      </CardContent>
    </Card>
  );
}
