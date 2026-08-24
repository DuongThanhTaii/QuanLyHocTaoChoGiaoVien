import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const allInvoices = invoices || [];
  
  const totalPaid = allInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    
  const totalUnpaid = allInvoices
    .filter(inv => ['draft', 'sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const estimatedTax = totalPaid * 0.05; // 5% of Total Paid

  const recentPaidInvoices = allInvoices
    .filter(inv => inv.status === 'paid')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tài chính & Thuế</h1>
          <p className="text-zinc-500">Báo cáo doanh thu và nghĩa vụ thuế của bạn.</p>
        </div>
        <Button variant="outline" className="border-zinc-300 text-zinc-700">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Xuất Excel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Tổng đã thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{totalPaid.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Tổng chưa thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{totalUnpaid.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Thuế dự kiến (5%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{estimatedTax.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Hóa đơn đã thu gần đây</CardTitle>
          <CardDescription>Các hóa đơn mới nhất đã được thanh toán.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPaidInvoices.length > 0 ? (
            <div className="space-y-4">
              {recentPaidInvoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-zinc-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-zinc-500">
                      {new Date(invoice.paid_at || invoice.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="font-bold text-emerald-600">
                    +{Number(invoice.total_amount).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Chưa có hóa đơn nào đã được thanh toán.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
