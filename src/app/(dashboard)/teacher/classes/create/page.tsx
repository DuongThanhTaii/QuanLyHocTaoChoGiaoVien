import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserBillingContext } from '@/lib/billing/server';
import { CreateClassWizard } from './CreateClassWizard';

export default async function CreateClassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const billing = user ? await getUserBillingContext(user.id) : null;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tạo Lớp Học Mới</h1><p className="text-zinc-500">Thiết lập thông tin cơ bản cho lớp học của bạn.</p></div>{billing && <Card className="border-amber-200 bg-amber-50 shadow-sm"><CardHeader className="py-4"><CardTitle className="flex items-center gap-2 text-base text-amber-800"><AlertCircle className="size-4" />Gói {billing.plan.name}</CardTitle><CardDescription className="text-amber-700">Bạn có thể có tối đa {billing.plan.entitlements.maxClasses} lớp đang hoạt động. Giới hạn được kiểm tra khi tạo lớp. <Link href="/pricing" className="font-medium underline">Xem gói</Link></CardDescription></CardHeader></Card>}<CreateClassWizard /></div>;
}
