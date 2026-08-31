import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getAppUrl } from '@/lib/app-url';
import { ClassStudentsView } from './ClassStudentsView';
import { StudentLedgerItem } from '../components/StudentProgressLedger';

export default async function ClassStudentsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const classId = params.id;
  const repos = await getRepositories();
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Lấy danh sách Enrollments & Students
  const { data: enrollmentsData } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('class_id', classId);

  const students = await Promise.all(
    (enrollmentsData || []).map(async (enrollment: any) => {
      const { data: studentProfile } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', enrollment.student_id)
        .single();
        
      // Fetch linked guardians
      const { data: studentGuardians } = await supabaseAdmin
        .from('student_guardians')
        .select(`
          relationship,
          guardians:guardian_id (
            id,
            user_id,
            full_name,
            phone,
            email
          )
        `)
        .eq('student_id', enrollment.student_id);

      const rawGuardians = (studentGuardians || []).map((sg: any) => {
        const g = Array.isArray(sg.guardians) ? sg.guardians[0] : sg.guardians;
        return {
          relationship: sg.relationship || 'GUARDIAN',
          id: g?.id,
          userId: g?.user_id,
          fullName: g?.full_name,
          phone: g?.phone,
          email: g?.email
        };
      }).filter((g: any) => g && (g.fullName || g.phone || g.email));

      const guardians = await Promise.all(
        rawGuardians.map(async (g: any) => {
          if (g.userId && (!g.phone || !g.email || !g.fullName)) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('full_name, phone, email')
              .eq('id', g.userId)
              .maybeSingle();
            if (profile) {
              return {
                ...g,
                fullName: g.fullName || profile.full_name,
                phone: g.phone || profile.phone,
                email: g.email || profile.email
              };
            }
          }
          return g;
        })
      );

      return {
        enrollment: {
          id: enrollment.id,
          studentId: enrollment.student_id,
          classId: enrollment.class_id,
          status: enrollment.status
        },
        studentProfile,
        guardians
      };
    })
  );

  // 2. Lấy mã mời tham gia lớp
  const { data: invitations } = await supabaseAdmin
    .from('class_invitations')
    .select('*')
    .eq('class_id', classId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const activeInvitation = invitations?.[0];

  // 3. Dữ liệu cho Tiến độ & Tổng hợp 360° (Student Progress Ledger)
  const { data: classInvoices } = await supabaseAdmin
    .from('invoices')
    .select('id, student_id, total_amount, status, period_start, invoice_number, created_at')
    .eq('class_id', classId);

  const { data: sessionsCount } = await supabaseAdmin
    .from('class_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', classId);

  const totalClassSessions = sessionsCount || 0;

  const { data: attendanceRecords } = await supabaseAdmin
    .from('attendance_records')
    .select('student_id, status')
    .eq('class_id', classId);

  const { data: evaluations } = await supabaseAdmin
    .from('session_evaluations')
    .select('student_id, rating, feedback, marked_at')
    .eq('class_id', classId)
    .order('marked_at', { ascending: false });

  const ledgerStudents: StudentLedgerItem[] = students
    .filter(s => s.studentProfile)
    .map(({ enrollment, studentProfile }) => {
      const stud = studentProfile;
      // Điểm danh
      const studAttendance = (attendanceRecords || []).filter((r: any) => r.student_id === stud.id);
      const attendedCount = studAttendance.filter((r: any) => r.status === 'present' || r.status === 'late').length;
      const absentCount = studAttendance.filter((r: any) => r.status === 'absent').length;
      const effectiveSessions = Math.max(totalClassSessions, studAttendance.length);
      const percentage = effectiveSessions > 0 ? Math.round((attendedCount / effectiveSessions) * 100) : 0;

      // Học phí
      const studInvoices = (classInvoices || [])
        .filter((i: any) => i.student_id === stud.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const latestInvoice = studInvoices[0];
      const tuitionStatus = latestInvoice ? (latestInvoice.status as 'paid' | 'sent' | 'overdue') : 'not_created';
      const invoiceAmount = latestInvoice ? Number(latestInvoice.total_amount || 0) : 0;

      // Đánh giá gần nhất
      const studEval = (evaluations || []).find((e: any) => e.student_id === stud.id);

      return {
        id: stud.id,
        fullName: stud.full_name,
        phone: stud.phone || null,
        email: stud.email || null,
        attendance: {
          attendedCount,
          totalSessions: effectiveSessions,
          absentCount,
          percentage
        },
        tuition: {
          status: tuitionStatus,
          amount: invoiceAmount,
          invoiceNumber: latestInvoice ? latestInvoice.invoice_number : null
        },
        evaluation: {
          rating: studEval ? studEval.rating : null,
          feedback: studEval ? studEval.feedback : null
        }
      };
    });

  return (
    <ClassStudentsView
      classId={classId}
      students={students}
      activeInvitation={activeInvitation}
      appUrl={appUrl}
      ledgerStudents={ledgerStudents}
    />
  );
}
