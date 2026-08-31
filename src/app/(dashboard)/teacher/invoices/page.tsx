import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { InvoiceListClient } from './components/InvoiceListClient';

export default async function TeacherInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Lấy danh sách hóa đơn kèm thông tin học sinh và lớp học
  const { data: invoicesData } = await supabase
    .from('invoices')
    .select(`
      *,
      students:student_id (
        id,
        full_name,
        phone,
        email
      ),
      classes:class_id (
        id,
        name,
        subject
      )
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  // 2. Lấy danh sách lớp học của giáo viên
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name, subject, fee_per_session, fee_type')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Lấy tài khoản ngân hàng mặc định của giáo viên để sinh VietQR
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <InvoiceListClient
        invoices={invoicesData || []}
        classes={classesData || []}
        bankAccount={bankAccount || null}
      />
    </div>
  );
}
