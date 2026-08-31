import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Sparkles, Smile, AlertCircle, AlertTriangle } from 'lucide-react';

const ratingBadgeMap: Record<string, { label: string; badge: string; icon: any }> = {
  EXCELLENT: { label: 'Xuất sắc', badge: 'bg-purple-50 text-purple-700 ring-purple-600/20', icon: Sparkles },
  GOOD: { label: 'Tốt', badge: 'bg-green-50 text-green-700 ring-green-600/20', icon: Smile },
  AVERAGE: { label: 'Cần cố gắng', badge: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20', icon: AlertCircle },
  POOR: { label: 'Chưa tập trung', badge: 'bg-red-50 text-red-700 ring-red-600/20', icon: AlertTriangle }
};

export default async function ParentStudentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Find guardian id first
  const { data: guardianData } = await admin
    .from('guardians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!guardianData) return <div className="p-12 text-center text-zinc-500">Bạn chưa có hồ sơ phụ huynh.</div>;

  // Verify parent has access to this student
  const { data: link } = await admin
    .from('student_guardians')
    .select('student_id')
    .eq('guardian_id', guardianData.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (!link) {
    return (
      <div className="p-12 text-center text-zinc-500">
        Bạn không có quyền xem thông tin của học sinh này.
      </div>
    );
  }

  const { data: profile } = await admin
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single();

  // Fetch evaluations
  const { data: evaluationsData } = await admin
    .from('session_evaluations')
    .select('*, class_sessions(*, classes(name)), profiles:marked_by(full_name)')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  const evaluations = evaluationsData || [];

  // Fetch attendance
  const { data: attendanceData } = await admin
    .from('attendance_records')
    .select('*, class_sessions(*, classes(name))')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false });

  const attendance = attendanceData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Tiến độ học tập: {profile?.full_name || 'Học sinh'}
          </h1>
          <p className="text-zinc-500 text-sm">Chi tiết nhận xét của giáo viên và lịch sử điểm danh.</p>
        </div>
        <Link href="/parent/students">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>

      {/* Menu con Tabs: Điểm danh & Đánh giá */}
      <Tabs defaultValue="evaluations" className="space-y-4">
        <TabsList className="bg-zinc-100 p-1 rounded-lg border border-zinc-200 inline-flex">
          <TabsTrigger value="evaluations" className="px-4 py-1.5 text-sm font-medium">
            Đánh giá
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-4 py-1.5 text-sm font-medium">
            Điểm danh
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Đánh giá & Nhận xét sau buổi học */}
        <TabsContent value="evaluations">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-lg text-zinc-900">Đánh giá & Nhận xét sau buổi học</CardTitle>
              <CardDescription>Nhận xét trực tiếp từ giáo viên về thái độ và kết quả từng buổi học</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Ngày</TableHead>
                    <TableHead>Lớp / Ca học</TableHead>
                    <TableHead className="w-[140px]">Đánh giá</TableHead>
                    <TableHead>Lời dặn của giáo viên</TableHead>
                    <TableHead className="w-[140px]">Giáo viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                        Chưa có nhận xét hoặc đánh giá nào từ giáo viên.
                      </TableCell>
                    </TableRow>
                  ) : (
                    evaluations.map((item: any) => {
                      const session = Array.isArray(item.class_sessions) ? item.class_sessions[0] : item.class_sessions;
                      const classes = Array.isArray(session?.classes) ? session?.classes[0] : session?.classes;
                      const teacherProfile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                      const ratingInfo = ratingBadgeMap[item.rating] || { label: item.rating, badge: 'bg-zinc-100 text-zinc-700', icon: Smile };
                      const RatingIcon = ratingInfo.icon;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-zinc-800">
                            {session?.session_date ? new Date(session.session_date).toLocaleDateString('vi-VN') : new Date(item.marked_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-zinc-900">{classes?.name || 'Lớp học'}</div>
                            <div className="text-xs text-zinc-500">{session?.start_time} - {session?.end_time}</div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ratingInfo.badge}`}>
                              <RatingIcon className="w-3.5 h-3.5" />
                              {ratingInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-zinc-700 leading-relaxed">
                            {item.feedback ? (
                              <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/70 text-sm">
                                {item.feedback}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Không có ghi chú thêm</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-600 font-medium">
                            {teacherProfile?.full_name || 'Giáo viên'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Lịch sử điểm danh */}
        <TabsContent value="attendance">
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <CardTitle className="text-lg text-zinc-900">Lịch sử điểm danh</CardTitle>
              <CardDescription>Theo dõi tình trạng chuyên cần và đi học đúng giờ</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Lớp / Ca học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-zinc-500">
                        Chưa có dữ liệu điểm danh.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((record: any) => {
                      const session = Array.isArray(record.class_sessions) ? record.class_sessions[0] : record.class_sessions;
                      const classes = Array.isArray(session?.classes) ? session?.classes[0] : session?.classes;
                      
                      let statusBadge = '';
                      let statusText = '';
                      switch (record.status) {
                        case 'present':
                          statusBadge = 'bg-green-50 text-green-700 ring-green-600/20';
                          statusText = 'Có mặt';
                          break;
                        case 'absent':
                          statusBadge = 'bg-red-50 text-red-700 ring-red-600/20';
                          statusText = 'Vắng mặt';
                          break;
                        case 'late':
                          statusBadge = 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
                          statusText = 'Đi muộn';
                          break;
                        case 'excused':
                          statusBadge = 'bg-blue-50 text-blue-700 ring-blue-600/20';
                          statusText = 'Có phép';
                          break;
                      }

                      return (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.marked_at || new Date()).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell>
                            <div className="font-medium">{classes?.name}</div>
                            <div className="text-xs text-zinc-500">{session?.start_time} - {session?.end_time}</div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge}`}>
                              {statusText}
                            </span>
                          </TableCell>
                          <TableCell>{record.note || '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
