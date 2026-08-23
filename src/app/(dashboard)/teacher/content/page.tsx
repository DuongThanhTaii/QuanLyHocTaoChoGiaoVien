import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thư viện Học liệu</h1>
        <p className="text-zinc-500">Quản lý toàn bộ bài giảng, tài liệu và bài tập của bạn.</p>
      </div>
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Kho tài liệu chung</CardTitle>
          <CardDescription>Các tài liệu dùng chung cho nhiều lớp.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50">
            <p className="text-zinc-500">Danh sách File (PDF, Video) upload qua Supabase Storage</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
