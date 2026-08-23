import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherSchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thời khóa biểu tổng</h1>
        <p className="text-zinc-500">Lịch giảng dạy tất cả các lớp của bạn trong tuần.</p>
      </div>
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Lịch học tuần này</CardTitle>
          <CardDescription>Chọn một lớp cụ thể để xem chi tiết hoặc điểm danh.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50">
            <p className="text-zinc-500">Giao diện Calendar sẽ được nhúng tại đây</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
