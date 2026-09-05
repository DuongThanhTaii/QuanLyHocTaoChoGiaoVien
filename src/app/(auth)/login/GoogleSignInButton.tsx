'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/client';

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.4 3.1-7.4Z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.5V7.6H2.9a10 10 0 0 0 0 8.8l3.3-2.7Z" /><path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.9 7.6l3.3 2.6C7 7.8 9.3 6 12 6Z" /></svg>;
}

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (authError) {
      setError('Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.');
      setPending(false);
    }
  };

  return <div className="space-y-2">
    <button type="button" onClick={signIn} disabled={pending} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
      {pending ? 'Đang chuyển đến Google...' : 'Đăng nhập với Google'}
    </button>
    <p className="text-center text-[11px] text-zinc-500">Google sẽ cấp quyền Drive một lần để bạn dùng Học liệu ngay sau khi đăng nhập.</p>
    {error && <p role="alert" className="text-center text-xs text-red-600">{error}</p>}
  </div>;
}
