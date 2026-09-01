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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số lớp học</CardTitle>
          <BookOpen className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{classes.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lịch dạy hôm nay</CardTitle>
          <Calendar className="h-4 w-4 text-zinc-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{todaySlotsCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
