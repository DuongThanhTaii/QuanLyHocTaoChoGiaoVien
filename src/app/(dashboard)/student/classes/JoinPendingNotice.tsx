'use client';

import { useEffect } from 'react';

export function JoinPendingNotice() {
  useEffect(() => {
    // The URL is only a one-time signal after the server action. Remove it so a refresh does not show this again.
    window.history.replaceState(window.history.state, '', '/student/classes');
  }, []);

  return <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">Gửi yêu cầu tham gia lớp thành công. Vui lòng chờ giáo viên duyệt.</div>;
}
