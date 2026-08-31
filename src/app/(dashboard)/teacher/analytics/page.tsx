import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsClient } from './components/AnalyticsClient';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Lấy thông tin profile và cài đặt thuế
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Lấy toàn bộ hóa đơn của giáo viên
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      students:student_id (
        id,
        full_name,
        phone
      ),
      classes:class_id (
        id,
        name
      )
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Lấy danh sách các lớp học của giáo viên
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, fee_per_session, fee_type')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <AnalyticsClient
      invoices={invoices || []}
      classes={classes || []}
      profile={profile || {}}
    />
  );
}
