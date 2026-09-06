import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { ExternalLink, MapPin, Video } from 'lucide-react';

import { ClassTabs } from './ClassTabs';

export default async function ClassWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: classroom } = await supabase
    .from('classes')
    .select('name, subject, fee_per_session, location, online_meeting_url')
    .eq('id', id)
    .single();

  if (!classroom) {
    return <div>Class not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{classroom.name}</h1>
          <p className="text-zinc-500">
            {classroom.subject || 'Chưa cập nhật môn học'} &bull; {Number(classroom.fee_per_session).toLocaleString('vi-VN')} đ/buổi
          </p>
          {(classroom.location || classroom.online_meeting_url) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {classroom.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{classroom.location}</span>}
              {classroom.online_meeting_url && <a href={classroom.online_meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><Video className="size-4" />Vào lớp trực tuyến <ExternalLink className="size-3.5" /></a>}
            </div>
          )}
        </div>
      </div>

      <ClassTabs classId={id} />

      {/* Tab Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
