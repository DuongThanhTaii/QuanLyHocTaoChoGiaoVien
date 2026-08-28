import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function TodaySchedule() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Giả lập độ trễ mạng để test skeleton (Xóa dòng này trong thực tế)
  // await new Promise(resolve => setTimeout(resolve, 3000));

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
    <Card>
      <CardHeader>
        <CardTitle>Lịch dạy hôm nay</CardTitle>
        <CardDescription>Các ca học trong ngày của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        {todaySlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
            <div className="relative w-48 h-48 mb-4">
              <img 
                src="/images/empty_states/empty_cat.jpg" 
                alt="No classes today" 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <p className="text-base font-medium text-zinc-600">Bạn không có lịch dạy nào hôm nay.</p>
            <p className="text-sm text-zinc-400 mt-1">Hãy dành thời gian nghỉ ngơi hoặc chuẩn bị giáo án nhé!</p>
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
  );
}
