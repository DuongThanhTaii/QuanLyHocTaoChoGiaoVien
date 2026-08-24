import { createClass } from '../actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { AlertCircle } from 'lucide-react';

export default async function CreateClassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let canCreateClass = true;
  let subscriptionMessage = '';
  let showTrialWarning = false;

  if (user) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('teacher_id', user.id)
      .single();

    if (subscription) {
      if (subscription.status !== 'active') {
        canCreateClass = false;
        subscriptionMessage = 'Gói cước của bạn đã hết hạn hoặc chưa được kích hoạt. Vui lòng nâng cấp gói Pro để tiếp tục tạo lớp học mới.';
      }
    } else {
      // No subscription found, assume trial
      showTrialWarning = true;
    }
  }

  if (!canCreateClass) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tạo Lớp Học Mới</h1>
          <p className="text-zinc-500">Thiết lập thông tin cơ bản cho lớp học của bạn.</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Tài khoản hết hạn
            </CardTitle>
            <CardDescription className="text-red-600">
              {subscriptionMessage}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/pricing" className={buttonVariants({ variant: 'default' })}>
              Nâng cấp tài khoản ngay
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tạo Lớp Học Mới</h1>
        <p className="text-zinc-500">Thiết lập thông tin cơ bản cho lớp học của bạn.</p>
      </div>

      {showTrialWarning && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader className="py-4">
            <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4" />
              Đang dùng thử
            </CardTitle>
            <CardDescription className="text-amber-700">
              Bạn đang sử dụng phiên bản dùng thử. Một số tính năng có thể bị giới hạn. <Link href="/pricing" className="underline font-medium">Nâng cấp ngay</Link> để trải nghiệm trọn vẹn.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

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
