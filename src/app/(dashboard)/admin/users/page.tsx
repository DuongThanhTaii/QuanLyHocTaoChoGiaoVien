import { Ban, Search, ShieldCheck, Unlock, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAdminUsers } from '@/lib/admin/users';
import { removeRestriction, restrictUser } from './actions';

const roleLabel: Record<string, string> = { admin: 'Admin', teacher: 'Giáo viên', student: 'Học sinh', parent: 'Phụ huynh', super_admin: 'Super admin', operations_admin: 'Operations', billing_admin: 'Billing', support_agent: 'Support' };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const users = await getAdminUsers(q);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Người dùng</h1><p className="mt-1 text-sm text-muted-foreground">Tra cứu tài khoản, trạng thái và vai trò được cấp.</p></div>
        <Button disabled title="Tài khoản được tạo qua luồng đăng ký hoặc lời mời"><UserPlus className="mr-2 size-4" />Thêm người dùng</Button>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Danh sách tài khoản</CardTitle><CardDescription>{users.length} tài khoản phù hợp. Khóa/ban luôn yêu cầu lý do và được ghi audit.</CardDescription></div>
          <form className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={q} className="pl-9" placeholder="Tìm theo tên hoặc email" /></form>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Người dùng</span><span>Vai trò</span><span>Trạng thái</span><span>Thao tác</span></div>
            {users.length ? users.map((user) => <UserRow key={user.id} user={user} />) : <EmptyRow />}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Tài khoản Super admin không thể bị khóa từ màn hình này. Quản lý dynamic role sẽ được thực hiện tại Vai trò & quyền.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyRow() {
  return <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-3 px-4 py-5 text-sm"><span className="text-muted-foreground">Không tìm thấy tài khoản phù hợp</span><Badge variant="outline" className="w-fit">—</Badge><Badge variant="outline" className="w-fit">—</Badge><Button size="sm" variant="ghost" disabled>Xem</Button></div>;
}

function UserRow({ user }: { user: Awaited<ReturnType<typeof getAdminUsers>>[number] }) {
  const isSuperAdmin = user.roles.includes('super_admin');
  const status = user.restriction ? (user.restriction.type === 'ban' ? 'Đã ban' : 'Đã khóa') : user.profileStatus === 'ACTIVE' ? 'Hoạt động' : user.profileStatus || 'Thiếu hồ sơ';
  const allRoles = [...new Set([...(user.primaryRole ? [user.primaryRole] : []), ...user.roles])];
  return <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm">
    <div className="min-w-0"><p className="truncate font-medium">{user.fullName}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
    <div className="flex flex-wrap gap-1">{allRoles.length ? allRoles.map((role) => <Badge key={role} variant="outline" className="text-[10px]">{roleLabel[role] ?? role}</Badge>) : <span className="text-xs text-destructive">Thiếu role</span>}</div>
    <Badge variant={user.restriction ? 'destructive' : 'secondary'} className="w-fit">{status}</Badge>
    <div className="flex justify-end gap-2">{user.restriction ? <form action={removeRestriction}><input type="hidden" name="userId" value={user.id} /><Button size="sm" variant="outline"><Unlock className="mr-1 size-3.5" />Mở khóa</Button></form> : isSuperAdmin ? <Button size="sm" variant="ghost" disabled><ShieldCheck className="mr-1 size-3.5" />Bảo vệ</Button> : <details className="relative"><summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs hover:bg-accent"><Ban className="mr-1 size-3.5" />Hạn chế</summary><form action={restrictUser} className="absolute right-0 z-10 mt-2 w-64 space-y-2 rounded-md border bg-popover p-3 shadow-lg"><input type="hidden" name="userId" value={user.id} /><p className="text-xs font-medium">Hạn chế {user.fullName}</p><select name="type" defaultValue="suspension" className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="suspension">Khóa tạm thời</option><option value="ban">Ban tài khoản</option></select><Input name="reason" required minLength={3} placeholder="Lý do (bắt buộc)" /><Button className="w-full" size="sm" variant="destructive">Xác nhận</Button></form></details>}</div>
  </div>;
}
