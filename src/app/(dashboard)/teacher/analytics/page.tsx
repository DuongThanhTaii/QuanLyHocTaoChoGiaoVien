import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const { data } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('teacher_id', user.id)
    .eq('status', 'paid')
    .gte('paid_at', startOfMonth.toISOString());
    
  const totalRevenue = (data || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const taxLiability = totalRevenue * 0.05; // Assuming 5% tax

  const reportData = {
    totalRevenue: totalRevenue,
    taxableRevenue: totalRevenue,
    taxLiability: taxLiability,
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Thống kê & Thuế</h1>
          <p className="text-zinc-500">Báo cáo doanh thu và nghĩa vụ thuế tháng {reportData.month}/{reportData.year}.</p>
        </div>
        <Button variant="outline" className="border-zinc-300 text-zinc-700">
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Xuất Excel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{reportData.totalRevenue.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>
        
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">DT chịu thuế</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{reportData.taxableRevenue.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Thuế dự kiến (5%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{reportData.taxLiability.toLocaleString('vi-VN')} đ</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-sm bg-zinc-50/50">
        <CardHeader>
          <CardTitle>Lưu ý quan trọng</CardTitle>
          <CardDescription>
            Số liệu trên được tổng hợp tự động từ các hóa đơn có trạng thái "Đã thu" trong tháng. 
            Bạn cần đối soát lại với thực tế trước khi sử dụng số liệu này để kê khai với cơ quan Thuế.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
