import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

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
    .select('name, subject, fee_per_session')
    .eq('id', id)
    .single();

  if (!classroom) {
    return <div>Class not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{classroom.name}</h1>
          <p className="text-zinc-500">
            {classroom.subject || 'Chưa cập nhật môn học'} &bull; {Number(classroom.fee_per_session).toLocaleString('vi-VN')} đ/buổi
          </p>
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
