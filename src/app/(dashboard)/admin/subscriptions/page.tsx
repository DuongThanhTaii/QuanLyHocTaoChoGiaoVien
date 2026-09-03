import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminBillingOverview } from '@/lib/billing/server';

const money = new Intl.NumberFormat('vi-VN');
const labels: Record<string, string> = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', cancelled: 'Đã hủy', expired: 'Hết hạn', failed: 'Lỗi', refunded: 'Hoàn tiền' };
type RecentOrder = { id: string; order_code: number; amount: number | string; status: string; user: { full_name: string | null; email: string | null }[]; plan: { name: string; code: string }[] };

export default async function SubscriptionsPage() {
  const data = await getAdminBillingOverview();
  const recentOrders = data.recentOrders as unknown as RecentOrder[];
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">Subscription & đơn thanh toán</h1><p className="mt-1 text-sm text-muted-foreground">Dữ liệu từ đơn nền tảng PayOS, tách biệt với hóa đơn học phí của giáo viên.</p></div><Card><CardHeader><CardTitle>Đơn gần đây</CardTitle><CardDescription>Webhook hợp lệ mới chuyển đơn sang trạng thái đã thanh toán và kích hoạt gói.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><div className="min-w-[720px] divide-y">{recentOrders.length ? recentOrders.map((order) => { const user = order.user[0]; const plan = order.plan[0]; return <div key={order.id} className="grid grid-cols-[1fr_1fr_120px_130px] items-center gap-4 p-4 text-sm"><div><p className="font-medium">{user?.full_name || user?.email || 'Người dùng'}</p><p className="text-xs text-muted-foreground">#{order.order_code}</p></div><div>{plan?.name || 'Gói'}</div><p className="font-medium">{money.format(Number(order.amount))} đ</p><Badge variant={order.status === 'paid' ? 'secondary' : order.status === 'failed' ? 'destructive' : 'outline'} className="w-fit">{labels[order.status] || order.status}</Badge></div>; }) : <p className="p-8 text-center text-sm text-muted-foreground">Chưa có đơn thanh toán nền tảng.</p>}</div></div></CardContent></Card></div>;
}
