import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

export default async function TeacherInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('*, profiles!invoices_student_id_fkey(full_name), classes!invoices_class_id_fkey(name)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const invoices = invoicesData || [];

  async function generateInvoices() {
    'use server';
    // Implementation for generating invoices would go here using AutoGenerateInvoiceUseCase
    console.log('Generating invoices...');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Quản lý Hóa đơn</h1>
          <p className="text-zinc-500">Theo dõi doanh thu và tình trạng học phí của học sinh.</p>
        </div>
        <form action={generateInvoices}>
          <Button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white">
            <Receipt className="mr-2 h-4 w-4" /> Sinh Hóa đơn tự động
          </Button>
        </form>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách Hóa đơn</CardTitle>
          <CardDescription>Các hóa đơn được tạo gần đây.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Chưa có hóa đơn nào</div>
          ) : (
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
                    <TableCell className="font-medium text-zinc-900">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.profiles?.full_name}</TableCell>
                    <TableCell className="text-zinc-500">{inv.classes?.name}</TableCell>
                    <TableCell className="text-zinc-500">{new Date(inv.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right font-medium">{Number(inv.total_amount).toLocaleString('vi-VN')} đ</TableCell>
                    <TableCell>
                      {inv.status === 'paid' && <Badge variant="secondary" className="bg-zinc-100 text-zinc-900">Đã thu</Badge>}
                      {inv.status === 'sent' && <Badge variant="outline" className="text-zinc-500">Chờ thanh toán</Badge>}
                      {inv.status === 'overdue' && <Badge variant="destructive">Quá hạn</Badge>}
                      {inv.status === 'draft' && <Badge variant="outline" className="text-zinc-500">Nháp</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">Chi tiết</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
