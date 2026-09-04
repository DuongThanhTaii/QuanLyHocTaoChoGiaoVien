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
        subject,
        fee_type
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

  const invoices = invoicesData || [];
  const classIds = [...new Set(invoices.map((invoice: any) => invoice.class_id))];
  const studentIds = [...new Set(invoices.map((invoice: any) => invoice.student_id))];
  const periodStarts = invoices.map((invoice: any) => invoice.period_start).filter(Boolean).sort();
  const periodEnds = invoices.map((invoice: any) => invoice.period_end).filter(Boolean).sort();

  const [{ data: sessionsData }, { data: attendanceData }] = classIds.length > 0 && periodStarts.length > 0 && periodEnds.length > 0
    ? await Promise.all([
        supabase.from('class_sessions').select('id, class_id, session_date, title, status').in('class_id', classIds).gte('session_date', periodStarts[0]).lte('session_date', periodEnds[periodEnds.length - 1]).neq('status', 'CANCELLED').order('session_date'),
        supabase.from('attendance_records').select('session_id, student_id, class_id, status').in('class_id', classIds).in('student_id', studentIds),
      ])
    : [{ data: [] }, { data: [] }];

  const sessionsByClass = new Map<string, any[]>();
  (sessionsData || []).forEach((session: any) => sessionsByClass.set(session.class_id, [...(sessionsByClass.get(session.class_id) || []), session]));
  const attendanceBySession = new Map<string, string>();
  (attendanceData || []).forEach((record: any) => attendanceBySession.set(`${record.class_id}:${record.student_id}:${record.session_id}`, String(record.status).toLowerCase()));

  const invoicesWithBillingSessions = invoices.map((invoice: any) => {
    const classroom = Array.isArray(invoice.classes) ? invoice.classes[0] : invoice.classes;
    if (classroom?.fee_type && classroom.fee_type !== 'per_session') return invoice;
    const sessionsInPeriod = (sessionsByClass.get(invoice.class_id) || []).filter((session) => session.session_date >= invoice.period_start && session.session_date <= invoice.period_end);
    const attended = sessionsInPeriod.filter((session) => ['present', 'late'].includes(attendanceBySession.get(`${invoice.class_id}:${invoice.student_id}:${session.id}`) || ''));
    const chargeableSessions = attended.length > 0 ? attended : sessionsInPeriod.slice(0, Number(invoice.sessions_count) || sessionsInPeriod.length);
    return {
      ...invoice,
      billingSessions: chargeableSessions.map((session) => ({
        date: session.session_date,
        title: session.title || undefined,
        status: attendanceBySession.get(`${invoice.class_id}:${invoice.student_id}:${session.id}`) || 'not_marked',
      })),
    };
  });

  return (
    <div className="space-y-6" data-tour-id="teacher-invoices">
      <InvoiceListClient
        invoices={invoicesWithBillingSessions}
        classes={classesData || []}
        bankAccount={bankAccount || null}
      />
    </div>
  );
}
