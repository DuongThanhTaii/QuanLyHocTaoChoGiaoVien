import { LockKeyhole, Plus, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const permissions = [
  ['Người dùng', 'Xem tài khoản', 'users.read'],
  ['Người dùng', 'Khóa / mở khóa', 'users.suspend'],
  ['Phân quyền', 'Gán vai trò', 'roles.assign'],
  ['Gói cước', 'Cập nhật giá', 'plans.update'],
  ['Billing', 'Bật / tắt thu phí', 'billing.toggle'],
  ['Nhật ký', 'Đọc audit log', 'audit.read'],
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Vai trò & quyền</h1><p className="mt-1 text-sm text-muted-foreground">Phân quyền theo từng hành động, thay vì chỉ kiểm tra role cố định.</p></div><Button disabled><Plus className="mr-2 size-4" />Tạo vai trò</Button></div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1"><CardHeader><CardTitle>Vai trò hệ thống</CardTitle><CardDescription>Role mẫu cho phiên bản đầu tiên.</CardDescription></CardHeader><CardContent className="space-y-3"><Role name="Super admin" note="Toàn quyền, không thể xóa role cuối cùng" system /><Role name="Operations admin" note="Vận hành người dùng và cấu hình" /><Role name="Billing admin" note="Gói cước, subscription và thanh toán" /><Role name="Support agent" note="Tra cứu dữ liệu, không sửa quyền" /></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Permission registry</CardTitle><CardDescription>Danh mục mã quyền sẽ được lưu trong database và áp dụng bởi API/RLS.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[1fr_1.3fr_1.2fr] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Module</span><span>Quyền</span><span>Mã</span></div>{permissions.map(([module, label, code]) => <div key={code} className="grid grid-cols-[1fr_1.3fr_1.2fr] gap-3 border-b px-4 py-3 text-sm last:border-0"><span>{module}</span><span>{label}</span><code className="text-xs text-muted-foreground">{code}</code></div>)}</div><div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><LockKeyhole className="mt-0.5 size-4 shrink-0" />Không cho người dùng tự cấp/sửa role; chỉ API có permission phù hợp mới thay đổi được.</div></CardContent></Card>
      </div>
    </div>
  );
}

function Role({ name, note, system = false }: { name: string; note: string; system?: boolean }) {
  return <div className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{name}</p>{system ? <Badge><ShieldCheck className="mr-1 size-3" />System</Badge> : <Badge variant="secondary">Mẫu</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>;
}
