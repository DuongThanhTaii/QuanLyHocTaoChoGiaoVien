import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Users, BookOpen } from 'lucide-react';

export default async function TeacherRoot() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get teacher's classes
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)
    .eq('is_active', true);

  const classes = classesData || [];
  const classIds = classes.map(c => c.id);

  const today = new Date().getDay();

  // Get today's schedule slots
  let todaySlots = [];
  if (classIds.length > 0) {
    const { data: slotsData } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        classes (name)
      `)
      .in('class_id', classIds)
      .eq('day_of_week', today)
      .order('start_time', { ascending: true });
    
    todaySlots = slotsData || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tổng quan</h1>
        <p className="text-zinc-500">Chào mừng bạn quay trở lại. Đây là lịch trình hôm nay của bạn.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lớp học</CardTitle>
            <BookOpen className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lịch dạy hôm nay</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySlots.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch dạy hôm nay</CardTitle>
          <CardDescription>Các ca học trong ngày của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {todaySlots.length === 0 ? (
            <div className="text-center py-6 text-zinc-500">
              Bạn không có lịch dạy nào hôm nay.
            </div>
          ) : (
            <div className="space-y-4">
              {todaySlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <h3 className="font-semibold">{slot.classes?.name} - {slot.title || 'Ca học'}</h3>
                    <p className="text-sm text-zinc-500">
                      Thời gian: {slot.start_time} - {slot.end_time}
                      {slot.room && <span> | Phòng: {slot.room}</span>}
                    </p>
                  </div>
                  <Link href={`/teacher/classes/${slot.class_id}/attendance`}>
                    <Button>Điểm danh ngay</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
