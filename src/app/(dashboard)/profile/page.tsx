import { createClient } from '@/infrastructure/auth/supabase/server';
import { BasicProfileForm, BankAccountsList, AddBankAccountForm, PayOSConfigForm } from './ProfileForms';
import { SubscriptionQuotaCard } from './SubscriptionQuotaCard';
import { getUserBillingContext, getUserQuotaSnapshot } from '@/lib/billing/server';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ upgraded?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Không có quyền truy cập</div>;
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: teacherProfile } = await supabase.from('teacher_profiles').select('phone').eq('user_id', user.id).maybeSingle();
  const profileWithPhone = { ...profile, phone: profile?.phone || teacherProfile?.phone || '' };
  const { data: primaryRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('is_primary', true).maybeSingle();
  const isTeacher = (primaryRole?.role || profile?.role) === 'teacher';
  const [billingContext, quota, params] = await Promise.all([
    isTeacher ? getUserBillingContext(user.id).catch(() => null) : null,
    isTeacher ? getUserQuotaSnapshot(user.id).catch(() => null) : null,
    searchParams,
  ]);

  // Fetch Bank Accounts
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Hồ sơ cá nhân</h1>
        <p className="text-zinc-500 mt-2">Quản lý thông tin liên hệ và cài đặt thanh toán của bạn.</p>
      </div>

      {params.upgraded === '1' && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Nâng cấp gói thành công. Hạn mức sử dụng của bạn đã được cập nhật.</div>}

      {isTeacher && billingContext && quota && <SubscriptionQuotaCard context={billingContext} quota={quota} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <BasicProfileForm profile={profileWithPhone} />
          
          <div className="pt-4 border-t border-zinc-200">
            <h2 className="text-xl font-semibold mb-4">Cài đặt Thanh toán</h2>
            <PayOSConfigForm profile={profile} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <BankAccountsList accounts={accounts || []} />
          <AddBankAccountForm />
        </div>
      </div>
    </div>
  );
}
