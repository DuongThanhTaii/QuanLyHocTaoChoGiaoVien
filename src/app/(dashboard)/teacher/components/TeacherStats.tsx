import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen } from 'lucide-react';

export default async function TeacherStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Giả lập độ trễ mạng để test skeleton (Xóa dòng này trong thực tế)
  // await new Promise(resolve => setTimeout(resolve, 2000));

  // Get teacher's classes
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)
    .eq('is_active', true);

  const classes = classesData || [];
  const classIds = classes.map(c => c.id);

  const today = new Date().getDay();

  // Get today's schedule slots count
  let todaySlotsCount = 0;
  if (classIds.length > 0) {
    const { count } = await supabase
      .from('schedule_slots')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds)
      .eq('day_of_week', today);
    
    todaySlotsCount = count || 0;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tổng số lớp học</span>
          <BookOpen className="w-4 h-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{classes.length}</div>
          <p className="text-xs text-zinc-500">Lớp học đang hoạt động</p>
        </CardContent>
      </Card>
      
      <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Lịch dạy hôm nay</span>
          <Calendar className="w-4 h-4 text-zinc-400" />
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{todaySlotsCount}</div>
          <p className="text-xs text-zinc-500">Buổi dạy theo thời khóa biểu</p>
        </CardContent>
      </Card>
    </div>
  );
}
