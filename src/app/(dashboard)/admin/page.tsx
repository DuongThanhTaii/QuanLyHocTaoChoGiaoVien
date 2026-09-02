import Link from 'next/link';
import { ArrowUpRight, CreditCard, ShieldAlert, Users, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const metrics = [
  { label: 'Tổng người dùng', value: '—', detail: 'Sẽ đồng bộ từ Supabase', icon: Users },
  { label: 'Giáo viên đang hoạt động', value: '—', detail: 'Theo 30 ngày gần nhất', icon: WalletCards },
  { label: 'Doanh thu tháng', value: '—', detail: 'MRR từ subscription', icon: CreditCard },
  { label: 'Cảnh báo bảo mật', value: '—', detail: 'Từ audit log', icon: ShieldAlert },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Trung tâm quản trị</h1>
            <Badge variant="secondary">Bản khung</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi vận hành, người dùng, phân quyền và doanh thu nền tảng.</p>
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
          <CardHeader>
            <CardTitle>Việc cần chú ý</CardTitle>
            <CardDescription>Các mục này sẽ có dữ liệu thật khi kết nối Supabase và Neon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Notice title="Kết nối dữ liệu quản trị" description="Cấu hình Supabase để hiển thị số liệu và quản lý tài khoản." action="Thiết lập" href="/admin/users" />
            <Notice title="Thiết lập phân quyền động" description="Tạo roles, permission registry và RLS trước khi cấp quyền cho đội vận hành." action="Xem quyền" href="/admin/roles" />
            <Notice title="Kho audit log Neon" description="Tách log bảo mật và log vận hành khỏi database nghiệp vụ." action="Xem nhật ký" href="/admin/logs" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Trạng thái hệ thống</CardTitle><CardDescription>Thông số kết nối sẽ được cập nhật tự động.</CardDescription></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <StatusRow label="Cơ sở dữ liệu nghiệp vụ" value="Chưa cấu hình" />
            <StatusRow label="Kho audit log" value="Chưa kết nối" />
            <StatusRow label="Billing" value="Chưa kích hoạt" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Notice({ title, description, action, href }: { title: string; description: string; action: string; href: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div><Link href={href} className={buttonVariants({ size: 'sm', variant: 'outline' })}>{action}</Link></div>;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><Badge variant="outline">{value}</Badge></div>;
}
