import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles, Smile, AlertCircle, AlertTriangle, Clock, MessageSquareQuote } from 'lucide-react';

const ratingBadgeMap: Record<string, { label: string; className: string; icon: any }> = {
  EXCELLENT: { label: 'Xuất sắc', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Sparkles },
  GOOD: { label: 'Tốt', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Smile },
  AVERAGE: { label: 'Cần cố gắng', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: AlertCircle },
  POOR: { label: 'Chưa tập trung', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: AlertTriangle }
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

  // Lấy các đánh giá của học sinh này trong lớp
  let evaluations: any[] = [];
  if (currentStudent) {
    const { data: records } = await admin
      .from('session_evaluations')
      .select('*, class_sessions(session_date, start_time, end_time), profiles:marked_by(full_name, email)')
      .eq('class_id', classId)
      .eq('student_id', currentStudent.id)
      .order('marked_at', { ascending: false });

    evaluations = records || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Đánh giá & Nhận xét
        </h2>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Lịch sử đánh giá của bạn ({evaluations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!evaluations.length ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Chưa có dữ liệu đánh giá nào cho bạn trong lớp này.
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Buổi học</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Mức đánh giá</TableHead>
                    <TableHead className="text-xs font-semibold">Lời dặn của giáo viên</TableHead>
                    <TableHead className="text-xs font-semibold">Giáo viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((item: any) => {
                    const session = Array.isArray(item.class_sessions) ? item.class_sessions[0] : item.class_sessions;
                    const teacherProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                    const ratingInfo = ratingBadgeMap[item.rating] || { 
                      label: item.rating || 'Đánh giá', 
                      className: 'bg-zinc-100 text-zinc-700 border-zinc-200', 
                      icon: Smile 
                    };
                    const RatingIcon = ratingInfo.icon;
                    const noteText = item.comment || item.feedback;

                    const sDate = session?.session_date ? new Date(session.session_date) : new Date(item.marked_at);
                    const formattedDate = sDate.toLocaleDateString('vi-VN', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    });

                    const startTime = session?.start_time ? session.start_time.substring(0, 5) : '';
                    const endTime = session?.end_time ? session.end_time.substring(0, 5) : '';

                    return (
                      <TableRow key={item.id} className="text-sm">
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block">
                              {formattedDate}
                            </span>
                            {startTime && endTime && (
                              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {startTime} - {endTime}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-semibold gap-1.5 py-1 px-2.5 ${ratingInfo.className}`}
                          >
                            <RatingIcon className="w-3.5 h-3.5" />
                            {ratingInfo.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-md">
                          {noteText ? (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                              <MessageSquareQuote className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="whitespace-pre-wrap">{noteText}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Không có ghi chú thêm</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar 
                              name={teacherProfile?.full_name || 'Giáo viên'} 
                              email={teacherProfile?.email} 
                              size="sm" 
                              className="w-7 h-7 text-[11px] shrink-0" 
                            />
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              {teacherProfile?.full_name || 'Giáo viên'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
