import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { JoinClassCard } from './JoinClassCard';

export default async function StudentClassesPage({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  const { join } = await searchParams;

  // TODO: Fetch real classes the student is enrolled in
  // Currently, we might need a student_enrollments table.
  // For now, let's just show a blank state or mock data.
  const classes: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Lớp học của tôi</h1>
        <p className="text-zinc-500">Danh sách các lớp học bạn đang tham gia.</p>
      </div>
      {join === 'pending' && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">Gửi yêu cầu tham gia lớp thành công. Vui lòng chờ giáo viên duyệt.</div>}
      <JoinClassCard />

      <Card>
        <CardHeader>
          <CardTitle>Các lớp học</CardTitle>
          <CardDescription>Cập nhật thông tin và bài tập từ giáo viên.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-zinc-300" />
              <h3 className="mt-4 text-lg font-medium text-zinc-900">Chưa có lớp học nào</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Bạn chưa được thêm vào lớp học nào. Vui lòng liên hệ giáo viên để được tham gia.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Render classes here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
