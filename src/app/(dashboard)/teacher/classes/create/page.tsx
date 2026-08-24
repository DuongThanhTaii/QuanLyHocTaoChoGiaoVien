import { createClass } from '../actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function CreateClassPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tạo Lớp Học Mới</h1>
        <p className="text-zinc-500">Thiết lập thông tin cơ bản cho lớp học của bạn.</p>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <form action={createClass as any}>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin lớp học</CardTitle>
            <CardDescription>Điền đầy đủ các thông tin bắt buộc để mở lớp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên lớp</Label>
              <Input id="name" name="name" required placeholder="VD: Toán 12A" className="bg-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Input id="subject" name="subject" placeholder="VD: Toán học" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feePerSession">Học phí / Buổi (VND)</Label>
                <Input 
                  id="feePerSession" 
                  name="feePerSession" 
                  type="number" 
                  required 
                  min="0" 
                  step="1000" 
                  placeholder="150000" 
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Nhãn màu</Label>
              <Select name="color" defaultValue="#18181b">
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn màu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#18181b">Đen bóng (Mặc định)</SelectItem>
                  <SelectItem value="#2563eb">Xanh dương</SelectItem>
                  <SelectItem value="#16a34a">Xanh lá</SelectItem>
                  <SelectItem value="#dc2626">Đỏ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-zinc-100 pt-6">
            <Link href="/teacher/classes" className={buttonVariants({ variant: 'outline', className: 'text-zinc-700' })}>
              Hủy
            </Link>
            <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">
              Khởi tạo Lớp
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
