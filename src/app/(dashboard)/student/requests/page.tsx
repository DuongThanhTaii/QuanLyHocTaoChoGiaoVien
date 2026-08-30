import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { RequestCard } from './components/RequestCard';

export default async function StudentRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: requests } = await supabase
    .from('guardian_student_requests')
    .select(`
      id,
      status,
      parent_id,
      profiles:parent_id(full_name, email)
    `)
    .eq('student_id', user.id)
    .eq('status', 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Yêu cầu liên kết</h1>
        <p className="text-zinc-500">Quản lý các yêu cầu liên kết tài khoản từ phụ huynh.</p>
      </div>

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
  );
}
