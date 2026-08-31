import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles, Smile, AlertCircle, AlertTriangle } from 'lucide-react';

const ratingBadgeMap: Record<string, { label: string; badge: string; icon: any }> = {
  EXCELLENT: { label: 'Xuất sắc', badge: 'bg-purple-50 text-purple-700 ring-purple-600/20', icon: Sparkles },
  GOOD: { label: 'Tốt', badge: 'bg-green-50 text-green-700 ring-green-600/20', icon: Smile },
  AVERAGE: { label: 'Cần cố gắng', badge: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20', icon: AlertCircle },
  POOR: { label: 'Chưa tập trung', badge: 'bg-red-50 text-red-700 ring-red-600/20', icon: AlertTriangle }
};

export default async function StudentEvaluationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: currentStudent } = await admin
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch evaluations for this student in this class
  let evaluations: any[] = [];
  if (currentStudent) {
    const { data: records } = await admin
      .from('session_evaluations')
      .select('*, class_sessions(session_date, start_time, end_time), profiles:marked_by(full_name)')
      .eq('class_id', classId)
      .eq('student_id', currentStudent.id)
      .order('marked_at', { ascending: false });

    evaluations = records || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Đánh giá & Nhận xét</h2>
        <p className="text-zinc-500">Xem nhận xét và đánh giá của giáo viên sau mỗi buổi học.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đánh giá của bạn</CardTitle>
          <CardDescription>Các đánh giá giúp bạn theo dõi tiến độ và cải thiện kết quả học tập</CardDescription>
        </CardHeader>
        <CardContent>
          {!evaluations.length ? (
            <p className="text-zinc-500 py-6 text-center">Chưa có dữ liệu đánh giá nào cho bạn trong lớp này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b text-zinc-500">
                  <tr>
                    <th className="pb-3 font-medium">Buổi học</th>
                    <th className="pb-3 font-medium">Mức đánh giá</th>
                    <th className="pb-3 font-medium">Lời dặn của giáo viên</th>
                    <th className="pb-3 font-medium">Giáo viên</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((item: any) => {
                    const session = Array.isArray(item.class_sessions) ? item.class_sessions[0] : item.class_sessions;
                    const teacherProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                    const ratingInfo = ratingBadgeMap[item.rating] || { label: item.rating, badge: 'bg-zinc-100 text-zinc-700', icon: Smile };
                    const RatingIcon = ratingInfo.icon;

                    return (
                      <tr key={item.id} className="border-b border-zinc-100">
                        <td className="py-4 font-medium text-zinc-800">
                          <div>
                            {session?.session_date ? new Date(session.session_date).toLocaleDateString('vi-VN') : new Date(item.marked_at).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-zinc-400 font-normal">
                            {session?.start_time} - {session?.end_time}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ratingInfo.badge}`}>
                            <RatingIcon className="w-3.5 h-3.5" />
                            {ratingInfo.label}
                          </span>
                        </td>
                        <td className="py-4 text-zinc-700 max-w-md">
                          {item.feedback ? (
                            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/70 text-sm">
                              {item.feedback}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Không có ghi chú thêm</span>
                          )}
                        </td>
                        <td className="py-4 text-xs text-zinc-600 font-medium">
                          {teacherProfile?.full_name || 'Giáo viên'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
