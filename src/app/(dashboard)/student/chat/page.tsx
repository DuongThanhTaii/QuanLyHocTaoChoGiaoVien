import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ChatLayout } from '@/components/chat/ChatLayout';

export default async function StudentChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tin nhắn</h1>
        <p className="text-zinc-500 text-sm">Trao đổi bài học với giáo viên và các bạn trong nhóm lớp.</p>
      </div>

      <ChatLayout
        currentUserId={user.id}
        currentUserName={profile?.full_name || 'Học sinh'}
        currentUserRole="student"
      />
    </div>
  );
}
