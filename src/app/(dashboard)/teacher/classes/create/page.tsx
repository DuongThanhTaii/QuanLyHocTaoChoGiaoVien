import { createClient } from '@/infrastructure/auth/supabase/server';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateClassWizard } from './CreateClassWizard';

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

      <CreateClassWizard />
    </div>
  );
}
