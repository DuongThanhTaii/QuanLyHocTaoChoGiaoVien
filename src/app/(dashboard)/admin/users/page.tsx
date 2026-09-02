import { Search, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Người dùng</h1><p className="mt-1 text-sm text-muted-foreground">Tra cứu tài khoản, trạng thái và vai trò được cấp.</p></div>
        <Button disabled><UserPlus className="mr-2 size-4" />Thêm người dùng</Button>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Danh sách tài khoản</CardTitle><CardDescription>Dữ liệu mẫu sẽ được thay bằng `profiles` và `user_roles`.</CardDescription></div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Tìm theo tên hoặc email" disabled /></div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Người dùng</span><span>Vai trò</span><span>Trạng thái</span><span>Thao tác</span></div>
            <EmptyRow />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Khi kết nối dữ liệu thật, trang này sẽ hỗ trợ lọc, khóa/mở khóa và gán role — mọi thay đổi đều được audit.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyRow() {
  return <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-3 px-4 py-5 text-sm"><span className="text-muted-foreground">Chưa có dữ liệu để hiển thị</span><Badge variant="outline" className="w-fit">—</Badge><Badge variant="outline" className="w-fit">—</Badge><Button size="sm" variant="ghost" disabled>Xem</Button></div>;
}
