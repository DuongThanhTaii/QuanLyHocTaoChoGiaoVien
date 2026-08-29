import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function StudentInvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Find all student profiles for this user (they might have multiple if unlinked, but generally one)
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id);

  const studentIds = (students || []).map(s => s.id);

  let invoices: any[] = [];
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('invoices')
      .select('*, profiles:student_id (full_name)') // Note: This join might need adjustment if student_id references students table, not profiles
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });
    invoices = data || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Hóa đơn học phí</h1>
        <p className="text-zinc-500">Xem và thanh toán học phí của bạn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Kỳ học</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                    Không có hóa đơn nào.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-xs">
                        {inv.id.split('-')[0].toUpperCase()}
                      </TableCell>
                      <TableCell>{(inv.total_amount).toLocaleString('vi-VN')} đ</TableCell>
                      <TableCell>{inv.month}/{inv.year}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          isPaid ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 
                          'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                        }`}>
                          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isPaid && (
                          <Button size="sm">Thanh toán ngay</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
