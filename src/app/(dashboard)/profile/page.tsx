import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { BasicProfileForm, BankAccountsList, AddBankAccountForm, MariAutoCollectionCard } from './ProfileForms';

export default async function ProfilePage() {
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
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('is_primary', true).maybeSingle();
  const isTeacher = roleData?.role === 'teacher';
  const profileWithPhone = { ...profile, phone: profile?.phone || teacherProfile?.phone || '' };

  // Fetch Bank Accounts
  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const cassoConnection = isTeacher ? (await getServiceClient()
    .from('casso_connections')
    .select('status, bank_account_id, last_synced_at, last_error')
    .eq('teacher_id', user.id)
    .maybeSingle()).data : null;
  const [{ data: collectionSetting }, { data: payables }] = isTeacher ? await Promise.all([
    getServiceClient().from('teacher_tuition_collection_settings').select('collection_mode').eq('teacher_id', user.id).maybeSingle(),
    getServiceClient().from('teacher_payables').select('status, net_amount').eq('teacher_id', user.id),
  ]) : [{ data: null }, { data: [] }];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-muted-foreground">Quản lý thông tin liên hệ và cài đặt thanh toán của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <BasicProfileForm profile={profileWithPhone} />
          
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <BankAccountsList accounts={accounts || []} cassoConnection={cassoConnection} />
          {isTeacher && <MariAutoCollectionCard setting={collectionSetting} payables={payables || []} />}
          <AddBankAccountForm isTeacher={isTeacher} />
        </div>
      </div>
    </div>
  );
}
