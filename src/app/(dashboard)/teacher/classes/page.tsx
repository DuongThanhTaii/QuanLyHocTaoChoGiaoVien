import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Users, PlusCircle } from 'lucide-react';

export default function TeacherClassesPage() {
  const classes = [
    { id: '1', name: 'Toán 12A', subject: 'Toán học', fee: 150000, students: 25 },
    { id: '2', name: 'Vật lý 11B', subject: 'Vật lý', fee: 120000, students: 18 }
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <Card key={c.id} className="border-zinc-200 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-zinc-900">{c.name}</CardTitle>
                  <CardDescription className="mt-1">{c.fee.toLocaleString('vi-VN')} đ/buổi</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
                  {c.subject}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-zinc-600 gap-2">
                <Users className="h-4 w-4" />
                <span>{c.students} học sinh</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-zinc-100 flex gap-2">
              <Button asChild variant="outline" className="w-full text-zinc-700">
                <Link href={`/teacher/classes/${c.id}/schedule`}>Lịch học</Link>
              </Button>
              <Button asChild className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
                <Link href={`/teacher/classes/${c.id}/attendance`}>Điểm danh</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
