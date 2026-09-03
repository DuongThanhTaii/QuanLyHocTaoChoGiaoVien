import Link from 'next/link';
import { ArrowUpRight, Ban, GraduationCap, Users, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboard } from '@/lib/admin/dashboard';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const actionLabels: Record<string, string> = {
  'users.restrict': 'Khóa tài khoản', 'users.unrestrict': 'Mở khóa tài khoản',
  'roles.assign': 'Gán vai trò', 'roles.revoke': 'Thu hồi vai trò',
  'plans.update': 'Cập nhật gói cước', 'billing.toggle': 'Đổi trạng thái billing',
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  const metrics = [
    { label: 'Tổng người dùng', value: data.users.toLocaleString('vi-VN'), detail: `${data.activeEnrollments} lượt ghi danh đang hoạt động`, icon: Users },
    { label: 'Giáo viên hoạt động', value: data.activeTeachers.toLocaleString('vi-VN'), detail: `${data.activeClasses} lớp đang mở`, icon: GraduationCap },
    { label: 'Doanh thu gói 30 ngày', value: currency.format(data.platformRevenue30d), detail: `Học phí giáo viên thu: ${currency.format(data.tuitionRevenue30d)}`, icon: WalletCards },
    { label: 'Cần xử lý', value: String(data.trialsEndingSoon + data.activeRestrictions), detail: `${data.trialsEndingSoon} trial sắp hết · ${data.activeRestrictions} tài khoản bị hạn chế`, icon: Ban },
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Trung tâm quản trị</h1>
            <Badge variant={data.billingEnabled ? 'default' : 'secondary'}>{data.billingEnabled ? 'Billing đang bật' : 'Billing đang tắt'}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Tổng quan vận hành và các việc cần được xử lý.</p>
        </div>
        <Link href="/admin/users" className={buttonVariants()}>Quản lý người dùng <ArrowUpRight className="ml-2 size-4" /></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Hoạt động quản trị gần đây</CardTitle><CardDescription>Các thay đổi quyền, hạn chế tài khoản và billing đều được lưu vết.</CardDescription></CardHeader>
          <CardContent>{data.recentAudit.length ? <div className="divide-y rounded-md border">{data.recentAudit.map((entry) => { const actor = Array.isArray(entry.actor) ? entry.actor[0] : entry.actor; return <div key={entry.id} className="flex items-center justify-between gap-4 p-3 text-sm"><div><p className="font-medium">{actionLabels[entry.action] ?? entry.action}</p><p className="text-xs text-muted-foreground">{actor?.full_name || actor?.email || 'Hệ thống'} · {new Date(entry.created_at).toLocaleString('vi-VN')}</p></div><Badge variant={entry.outcome === 'success' ? 'secondary' : 'destructive'}>{entry.outcome === 'success' ? 'Thành công' : 'Thất bại'}</Badge></div>; })}</div> : <Empty text="Chưa có thao tác quản trị nào được ghi nhận." />}</CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Trạng thái hệ thống</CardTitle><CardDescription>Thông tin lấy từ dữ liệu vận hành hiện tại.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <StatusRow label="Cơ sở dữ liệu nghiệp vụ" value="Hoạt động" />
            <StatusRow label="Audit log" value="Đang ghi nhận" />
            <StatusRow label="Billing" value={data.billingEnabled ? 'Đang bật' : 'Đang tắt'} />
            <Link className={buttonVariants({ size: 'sm', variant: 'outline' })} href="/admin/logs">Xem nhật ký</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><Badge variant="outline">{value}</Badge></div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }
