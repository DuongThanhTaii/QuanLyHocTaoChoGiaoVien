import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';

export default function TeacherInvoicesPage() {
  const invoices = [
    { id: '1', invoiceNumber: 'HD-2026-00123', student: 'Nguyễn Văn A', class: 'Toán 12A', amount: 1200000, status: 'paid', date: '05/08/2026' },
    { id: '2', invoiceNumber: 'HD-2026-00124', student: 'Trần Thị B', class: 'Toán 12A', amount: 1050000, status: 'sent', date: '05/08/2026' },
    { id: '3', invoiceNumber: 'HD-2026-00125', student: 'Lê Văn C', class: 'Vật lý 11B', amount: 960000, status: 'overdue', date: '05/07/2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Quản lý Hóa đơn</h1>
          <p className="text-zinc-500">Theo dõi doanh thu và tình trạng học phí của học sinh.</p>
        </div>
        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
          <Receipt className="mr-2 h-4 w-4" /> Sinh Hóa đơn tự động (Tháng 8)
        </Button>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách Hóa đơn</CardTitle>
          <CardDescription>Các hóa đơn được tạo gần đây.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Học sinh</TableHead>
                <TableHead>Lớp học</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-zinc-900">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.student}</TableCell>
                  <TableCell className="text-zinc-500">{inv.class}</TableCell>
                  <TableCell className="text-zinc-500">{inv.date}</TableCell>
                  <TableCell className="text-right font-medium">{inv.amount.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>
                    {inv.status === 'paid' && <Badge variant="secondary" className="bg-zinc-100 text-zinc-900">Đã thu</Badge>}
                    {inv.status === 'sent' && <Badge variant="outline" className="text-zinc-500">Chờ thanh toán</Badge>}
                    {inv.status === 'overdue' && <Badge variant="destructive">Quá hạn</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">Chi tiết</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
