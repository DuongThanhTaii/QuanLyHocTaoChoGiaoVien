import { Card, CardContent } from '@/components/ui/card';
import { getAdminBillingOverview } from '@/lib/billing/server';
import { PlansEditor } from './plans-editor';

const money = new Intl.NumberFormat('vi-VN');

export default async function PlansPage() {
  const data = await getAdminBillingOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gói & thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">Giá mới áp dụng cho đơn mới; gói đã thanh toán luôn giữ giá tại thời điểm mua.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Doanh thu gói tháng này" value={`${money.format(data.revenueThisMonth)} đ`} />
        <Metric label="Subscription đang hiệu lực" value={String(data.activeSubscriptions)} />
        <Metric label="Đơn đang chờ thanh toán" value={String(data.pendingOrders)} />
      </div>
      <PlansEditor plans={data.plans} billingMode={data.settings.mode} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}
