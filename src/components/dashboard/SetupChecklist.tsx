import Link from 'next/link';
import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

type DashboardRole = 'teacher' | 'student' | 'parent';

type SetupItem = {
  label: string;
  description: string;
  href: string;
  complete: boolean;
};

export async function SetupChecklist({ role }: { role: DashboardRole }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  const hasName = Boolean(profile?.full_name?.trim());
  let phone = profile?.phone || '';
  const items: SetupItem[] = [
    {
      label: 'Cập nhật họ và tên',
      description: 'Giúp lớp học và liên hệ hiển thị đúng thông tin của bạn.',
      href: '/profile',
      complete: hasName,
    },
  ];

  if (role === 'teacher') {
    const [{ data: teacherProfile }, { count: bankAccountCount }, { count: classCount }] = await Promise.all([
      supabase.from('teacher_profiles').select('phone').eq('user_id', user.id).maybeSingle(),
      supabase.from('bank_accounts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('is_active', true),
    ]);

    phone = phone || teacherProfile?.phone || '';
    items.push(
      { label: 'Thêm số điện thoại liên hệ', description: 'Để học sinh và phụ huynh có thể liên hệ khi cần.', href: '/profile', complete: Boolean(phone.trim()) },
      { label: 'Thêm tài khoản nhận tiền', description: 'Cần thiết để nhận học phí từ học sinh.', href: '/profile', complete: (bankAccountCount || 0) > 0 },
      { label: 'Tạo lớp học đầu tiên', description: 'Bắt đầu quản lý học sinh, lịch học và học phí.', href: '/teacher/classes/create', complete: (classCount || 0) > 0 },
    );
  } else if (role === 'student') {
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    const { count: guardianCount } = student
      ? await admin.from('student_guardians').select('*', { count: 'exact', head: true }).eq('student_id', student.id)
      : { count: 0 };

    items.push(
      { label: 'Thêm số điện thoại liên hệ', description: 'Để giáo viên hoặc phụ huynh có thể liên hệ khi cần.', href: '/profile', complete: Boolean(phone.trim()) },
      { label: 'Liên kết với phụ huynh', description: 'Cho phép phụ huynh theo dõi lịch học và kết quả của bạn.', href: '/student/requests', complete: (guardianCount || 0) > 0 },
    );
  } else {
    const { data: guardian } = await admin
      .from('guardians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    const { count: studentCount } = guardian
      ? await admin.from('student_guardians').select('*', { count: 'exact', head: true }).eq('guardian_id', guardian.id)
      : { count: 0 };

    items.push(
      { label: 'Thêm số điện thoại liên hệ', description: 'Để giáo viên có thể liên hệ với bạn khi cần.', href: '/profile', complete: Boolean(phone.trim()) },
      { label: 'Liên kết với học sinh', description: 'Theo dõi thời khóa biểu, điểm danh và học phí của con.', href: '/parent/students', complete: (studentCount || 0) > 0 },
    );
  }

  if (items.every((item) => item.complete)) return null;

  const completedCount = items.filter((item) => item.complete).length;

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-label="Việc cần hoàn tất">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <ClipboardCheck className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Việc cần hoàn tất</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{completedCount}/{items.length} bước đã xong</p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-zinc-100 px-5">
        {items.map((item) => (
          <li key={item.label} className="py-3.5">
            <Link href={item.href} className="group flex gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
              {item.complete ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-4 shrink-0 text-zinc-300 group-hover:text-orange-500" />}
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium xl:whitespace-nowrap ${item.complete ? 'text-zinc-400 line-through' : 'text-zinc-800 group-hover:text-orange-600'}`}>{item.label}</span>
                <span className={`mt-0.5 block text-xs leading-5 xl:whitespace-nowrap ${item.complete ? 'text-zinc-300 line-through' : 'text-zinc-500'}`}>{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
