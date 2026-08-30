import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestCard } from './components/RequestCard';
import { Users, UserCheck } from 'lucide-react';

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
    .single();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Yêu cầu liên kết</h1>
        <p className="text-zinc-500">Quản lý các yêu cầu là tài khoản liên kết với phụ huynh.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-500" /> Yêu cầu đang chờ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!requests || requests.length === 0 ? (
            <Card className="col-span-full border-dashed bg-zinc-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                <p>Không có yêu cầu liên kết nào đang chờ.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))
         )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center"><UserCheck className="w-5 h-5 mp-2 text-green-500" /> Tài khoản phụ huynh đã liên kết</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {linkedGuardians.length === 0 ? (
            <Card className="col-span-full border-dashed bg-zinc-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                <p>Chưa có phụ huynh nào được liên kết.</p>
              </CardContent>
            </Card>
          ) : (
            linkedGuardians.map((item: any) => {
              const guardian = Array.isArray(item.guardians) ? item.guardians[0] : item.guardians;
              return (
                <Card key={item.guardian_id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle>{guardian?.full_name || 'Phụ huynh'}</CardTitle>
                    <CardDescription>Email: {guardian?.email || ''}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
