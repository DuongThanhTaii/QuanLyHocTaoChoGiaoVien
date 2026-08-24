import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Users, PlusCircle } from 'lucide-react';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();
  const classes = await repos.classes.findByTeacherId(user.id);

  // Fetch enrollment counts
  const classesWithCounts = await Promise.all(
    classes.map(async (c: any) => {
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', c.id)
        .is('left_at', null);
        
      return {
        id: c.id,
        name: c.name,
        subject: (c as any)._subject,
        color: (c as any)._color,
        feeAmount: c.feePerSession.amount,
        studentsCount: count || 0
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Lớp học của tôi</h1>
          <p className="text-zinc-500">Quản lý các lớp học và học sinh bạn đang giảng dạy.</p>
        </div>
        <Link href="/teacher/classes/create">
          <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo lớp mới
          </Button>
        </Link>
      </div>

      {classesWithCounts.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 bg-white rounded-lg border border-zinc-200">
          Chưa có lớp học nào. Hãy tạo lớp học đầu tiên của bạn.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesWithCounts.map((c: any) => (
            <Card key={c.id} className="border-zinc-200 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-zinc-900">{c.name}</CardTitle>
                    <CardDescription className="mt-1">{(c.feeAmount || 0).toLocaleString('vi-VN')} đ/buổi</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
                    {c.subject || 'Khác'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-zinc-600 gap-2">
                  <Users className="h-4 w-4" />
                  <span>{c.studentsCount} học sinh</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-zinc-100 flex gap-2">
                <Link href={`/teacher/classes/${c.id}/schedule`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full text-zinc-700">
                  Lịch học
                </Link>
                <Link href={`/teacher/classes/${c.id}/attendance`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors bg-zinc-900 text-white hover:bg-zinc-800 h-9 px-4 py-2 w-full">
                  Điểm danh
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
