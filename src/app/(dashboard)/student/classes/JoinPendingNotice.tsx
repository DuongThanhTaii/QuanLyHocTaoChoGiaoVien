'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function JoinPendingNotice() {
  useEffect(() => {
    toast.success('Gửi yêu cầu tham gia lớp thành công. Vui lòng chờ giáo viên duyệt.');
    // The URL is only a one-time signal after the server action. Remove it immediately.
    window.history.replaceState(window.history.state, '', '/student/classes');
  }, []);

  return null;
}
