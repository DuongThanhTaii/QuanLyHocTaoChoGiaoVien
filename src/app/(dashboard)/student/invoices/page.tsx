import { createClient } from '@/infrastructure/auth/supabase/server';
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Receipt, CheckCircle2, Clock, QrCode, ExternalLink } from 'lucide-react';

export default async function StudentInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Lấy các student ID của user này
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id);

  const studentIds = (students || []).map(s => s.id);

  let invoices: any[] = [];
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        classes:class_id (
          id,
          name
        )
      `)
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    invoices = data || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Hóa đơn học phí của tôi</h1>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
          <CardDescription>Các phiếu thu học phí được giáo viên phát hành.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed rounded-xl space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="text-sm">Hiện bạn chưa có hóa đơn học phí nào.</p>
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Mã HĐ</TableHead>
                    <TableHead className="text-xs font-semibold">Lớp học</TableHead>
                    <TableHead className="text-xs font-semibold">Kỳ học</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Số tiền</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs font-semibold text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const classroom = Array.isArray(inv.classes) ? inv.classes[0] : inv.classes;
                    const isPaid = inv.status === 'paid';

                    let paymentToken = inv.payment_token || inv.id;
                    if (inv.notes && inv.notes.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(inv.notes);
                        if (parsed.payment_token) paymentToken = parsed.payment_token;
                      } catch (e) {}
                    }

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold text-xs">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {classroom?.name || 'Lớp học'}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {new Date(inv.period_start).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {Number(inv.total_amount).toLocaleString('vi-VN')} đ
                        </TableCell>
                        <TableCell className="text-center">
                          {isPaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Đã thanh toán
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50/50 text-[11px]">
                              <Clock className="w-3 h-3 mr-1" /> Chờ thanh toán
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/invoices/view/${paymentToken}`} target="_blank">
                            <Button size="sm" variant={isPaid ? "outline" : "default"} className={isPaid ? "" : "bg-blue-600 hover:bg-blue-700 text-white"}>
                              {isPaid ? (
                                <>
                                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Xem phiếu
                                </>
                              ) : (
                                <>
                                  <QrCode className="w-3.5 h-3.5 mr-1" /> Quét VietQR trả ngay
                                </>
                              )}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
