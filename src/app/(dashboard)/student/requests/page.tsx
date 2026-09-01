import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestCard } from './components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function StudentRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Sử dụng admin client để bypass RLS (ví học sinh không có quyền xem profile của phụ huynh)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: requests } = await supabaseAdmin
    .from('guardian_student_requests')
    .select(`
      id,
      status,
      parent_id,
      profiles!parent_id(full_name, email)
    `)
    .eq('student_id', user.id)
    .eq('status', 'PENDING');

  const { data: studentData } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let linkedGuardians: any[] = [];
  if (studentData) {
    const { data: sgData } = await supabaseAdmin
      .from('student_guardians')
      .select(`
        guardian_id,
        guardians:guardian_id(full_name, email)
      `)
      .eq('student_id', studentData.id);
    if (sgData) {
      linkedGuardians = sgData;
    }
  }

  const pendingCount = requests ? requests.length : 0;
  const linkedCount = linkedGuardians.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Yêu cầu liên kết</h1>
        <p className="text-zinc-500 text-sm">Quản lý các yêu cầu là tài khoản liên kết với phụ huynh.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 h-11 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger 
            value="pending" 
            className="text-sm font-semibold h-9 rounded-lg gap-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
          >
            <span>Yêu cầu đang chờ</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-primary text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger 
            value="linked" 
            className="text-sm font-semibold h-9 rounded-lg gap-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-xs"
          >
            <span>Tài khoản phụ huynh đã liên kết</span>
            {linkedCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200">
                {linkedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Yêu cầu đang chờ */}
        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!requests || requests.length === 0 ? (
              <Card className="col-span-full border-dashed bg-zinc-50 dark:bg-zinc-900/40">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                  <p className="text-sm">Không có yêu cầu liên kết nào đang chờ.</p>
                </CardContent>
              </Card>
            ) : (
              requests.map(req => (
                <RequestCard key={req.id} request={req} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Tài khoản phụ huynh đã liên kết */}
        <TabsContent value="linked" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {linkedGuardians.length === 0 ? (
              <Card className="col-span-full border-dashed bg-zinc-50 dark:bg-zinc-900/40">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                  <p className="text-sm">Chưa có phụ huynh nào được liên kết.</p>
                </CardContent>
              </Card>
            ) : (
              linkedGuardians.map((item: any) => {
                const guardian = Array.isArray(item.guardians) ? item.guardians[0] : item.guardians;
                return (
                  <Card key={item.guardian_id} className="border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800/60 shadow-xs">
                    <CardHeader>
                      <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">{guardian?.full_name || 'Phụ huynh'}</CardTitle>
                      <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">Email: {guardian?.email || ''}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
