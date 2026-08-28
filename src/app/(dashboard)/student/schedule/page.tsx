import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default async function StudentSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thời khóa biểu</h1>
        <p className="text-zinc-500">Lịch học sắp tới của bạn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch học tuần này</CardTitle>
          <CardDescription>Danh sách các ca học</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-zinc-300" />
            <h3 className="mt-4 text-lg font-medium text-zinc-900">Chưa có lịch học</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Bạn không có ca học nào trong tuần này.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
