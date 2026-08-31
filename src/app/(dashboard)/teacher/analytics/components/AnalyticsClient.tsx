'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  HelpCircle, 
  ExternalLink,
  ShieldCheck,
  BookOpen,
  PieChart as PieIcon,
  Download,
  Calendar,
  Save,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveTaxSettingsAction } from '../actions';
import { toast } from 'sonner';

interface Props {
  invoices: any[];
  classes: any[];
  profile: any;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'];

export function AnalyticsClient({ invoices, classes, profile }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [thresholdLimit, setThresholdLimit] = useState<number>(100000000); // 100tr/năm (TT40) hoặc 200tr/năm (2026)

  // Profile Tax Settings
  const [taxCode, setTaxCode] = useState<string>(profile?.tax_code || '');
  const [taxAuthority, setTaxAuthority] = useState<string>(profile?.tax_authority || 'Chi cục Thuế khu vực');
  const [taxBusinessType, setTaxBusinessType] = useState<string>(profile?.tax_business_type || 'personal');
  const [savingTax, setSavingTax] = useState(false);

  // Lọc hóa đơn theo năm đã chọn
  const yearInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.paid_at || inv.period_start || inv.created_at);
    return invDate.getFullYear() === selectedYear;
  });

  // Tính toán doanh thu
  const totalPaidRevenue = yearInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const totalInvoiced = yearInvoices
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const totalPending = yearInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'draft')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const totalOverdue = yearInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  // Phân tích Tiền mặt vs Chuyển khoản
  const cashPaid = yearInvoices
    .filter(inv => inv.status === 'paid' && inv.payment_method === 'cash')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const bankPaid = yearInvoices
    .filter(inv => inv.status === 'paid' && inv.payment_method !== 'cash')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  // Doanh thu theo 12 tháng
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthInvoices = yearInvoices.filter(inv => {
      const d = new Date(inv.paid_at || inv.period_start || inv.created_at);
      return d.getMonth() + 1 === monthNum;
    });

    const paid = monthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    const pending = monthInvoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    return {
      month: `Thg ${monthNum}`,
      paid,
      pending
    };
  });

  // Doanh thu theo Quý
  const quarters = [
    { name: 'Quý 1 (Thg 1 - 3)', months: [1, 2, 3] },
    { name: 'Quý 2 (Thg 4 - 6)', months: [4, 5, 6] },
    { name: 'Quý 3 (Thg 7 - 9)', months: [7, 8, 9] },
    { name: 'Quý 4 (Thg 10 - 12)', months: [10, 11, 12] },
  ].map(q => {
    const qInvoices = yearInvoices.filter(inv => {
      const d = new Date(inv.paid_at || inv.period_start || inv.created_at);
      return q.months.includes(d.getMonth() + 1);
    });

    const rev = qInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    return {
      quarter: q.name,
      revenue: rev,
      taxTncn: totalPaidRevenue > thresholdLimit ? rev * 0.02 : 0,
      taxGtgt: 0 // Dịch vụ giáo dục không chịu thuế GTGT
    };
  });

  // Thuế TNCN (2% theo TT 40/2021/TT-BTC)
  const isTaxable = totalPaidRevenue > thresholdLimit;
  const estimatedTaxTncn = isTaxable ? totalPaidRevenue * 0.02 : 0;
  const estimatedTaxGtgt = 0; // Hoạt động giáo dục KHÔNG chịu thuế GTGT (0%)

  // Phân tích theo Lớp
  const classBreakdown = classes.map(cls => {
    const clsInvoices = yearInvoices.filter(inv => inv.class_id === cls.id);
    const paid = clsInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const pending = clsInvoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalCount = clsInvoices.length;

    return {
      id: cls.id,
      name: cls.name,
      paid,
      pending,
      totalCount
    };
  });

  // Dữ liệu tròn phân bổ phương thức
  const paymentMethodPieData = [
    { name: 'Chuyển khoản / VietQR', value: bankPaid },
    { name: 'Tiền mặt', value: cashPaid }
  ].filter(d => d.value > 0);

  // Xuất file Excel báo cáo thu chi
  function handleExportExcel() {
    const worksheetData = [
      ['BÁO CÁO DOANH THU & NGHĨA VỤ THUẾ GIÁO VIÊN'],
      [`Năm tài chính: ${selectedYear}`],
      [`Giáo viên: ${profile?.full_name || 'Gia sư'}`],
      [`Mã số thuế: ${taxCode || 'Chưa cập nhật'}`],
      [],
      ['TỔNG QUAN TÀI CHÍNH'],
      ['Chỉ tiêu', 'Số tiền (VNĐ)'],
      ['Tổng thực nhận (Đã thu)', totalPaidRevenue],
      ['Chuyển khoản / VietQR', bankPaid],
      ['Tiền mặt', cashPaid],
      ['Học phí chờ thu / nợ', totalPending],
      ['Thuế TNCN ước tính (2%)', estimatedTaxTncn],
      ['Thuế GTGT (0% - Không chịu thuế)', 0],
      [],
      ['CHI TIẾT DANH SÁCH HÓA ĐƠN'],
      ['Mã HĐ', 'Học sinh', 'Lớp học', 'Kỳ tính phí', 'Tổng tiền', 'Trạng thái', 'Phương thức', 'Ngày thanh toán']
    ];

    yearInvoices.forEach(inv => {
      worksheetData.push([
        inv.invoice_number,
        inv.students?.full_name || inv.profiles?.full_name || 'Học sinh',
        inv.classes?.name || 'Lớp học',
        `${inv.period_start} đến ${inv.period_end}`,
        Number(inv.total_amount),
        inv.status === 'paid' ? 'Đã thu' : 'Chờ thu',
        inv.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
        inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('vi-VN') : ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BaoCao_${selectedYear}`);

    XLSX.writeFile(wb, `BaoCao_HocPhi_Thue_${selectedYear}.xlsx`);
    toast.success('Đã xuất file Excel báo cáo thành công!');
  }

  // Lưu thông tin thuế
  async function handleSaveTaxSettings() {
    setSavingTax(true);
    try {
      await saveTaxSettingsAction({
        tax_code: taxCode,
        tax_authority: taxAuthority,
        tax_business_type: taxBusinessType
      });
      toast.success('Đã lưu thông tin Mã số thuế thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi lưu thông tin thuế: ' + err.message);
    } finally {
      setSavingTax(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Chọn năm */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Tài chính & Thuế</h1>
          <p className="text-sm text-zinc-500">Báo cáo doanh thu thực nhận, đối soát công nợ và công cụ tính thuế chuẩn luật Việt Nam.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32">
            <Select value={String(selectedYear)} onValueChange={(v) => v && setSelectedYear(Number(v))}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={String(y)}>Năm {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs border-zinc-300 dark:border-zinc-700"
          >
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" /> Xuất Excel
          </Button>
        </div>
      </div>

      {/* Tabs Chuyển đổi Báo cáo Tài chính & Công cụ Thuế */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="financial" className="text-xs font-semibold">
            📊 Thống kê Thu - Chi
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs font-semibold">
            ⚖️ Công cụ Kê khai Thuế
          </TabsTrigger>
        </TabsList>

        {/* ================= TAB 1: THỐNG KÊ THU - CHI & THỰC NHẬN ================= */}
        <TabsContent value="financial" className="space-y-6">
          {/* 4 Thẻ chỉ số chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between">
                  <span>Thực nhận đã thu</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalPaidRevenue.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 flex gap-2">
                  <span>💳 CK: {bankPaid.toLocaleString('vi-VN')}đ</span>
                  <span>•</span>
                  <span>💵 TM: {cashPaid.toLocaleString('vi-VN')}đ</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between">
                  <span>Học phí chờ thu</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalPending.toLocaleString('vi-VN')} đ
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Đang chờ phụ huynh chuyển khoản</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between">
                  <span>Tổng phát hành</span>
                  <DollarSign className="w-4 h-4 text-zinc-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalInvoiced.toLocaleString('vi-VN')} đ
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Tổng học phí đã lập hóa đơn</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between">
                  <span>Tỷ lệ thu thành công</span>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalInvoiced > 0 ? Math.round((totalPaidRevenue / totalInvoiced) * 100) : 0}%
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Tỷ lệ phụ huynh nộp đúng hạn</p>
              </CardContent>
            </Card>
          </div>

          {/* Biểu đồ Doanh thu theo tháng & Cơ cấu thanh toán */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Biểu đồ Doanh thu 12 Tháng ({selectedYear})</CardTitle>
                <CardDescription>Theo dõi dòng tiền thực nhận và công nợ phát sinh qua từng tháng.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v / 1000000}M`}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`]}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="paid" name="Đã thực nhận" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" name="Chờ thanh toán" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Cơ cấu Phương thức Thu</CardTitle>
                <CardDescription>Tỷ lệ thanh toán Tiền mặt vs Chuyển khoản.</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethodPieData.length === 0 ? (
                  <div className="flex items-center justify-center h-56 text-xs text-zinc-400">
                    Chưa có giao dịch thanh toán trong năm này.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {paymentMethodPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`]}
                          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t text-xs">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Chuyển khoản / VietQR:
                    </span>
                    <span className="font-bold">{bankPaid.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tiền mặt (Cash):
                    </span>
                    <span className="font-bold">{cashPaid.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bảng Doanh thu theo từng Lớp học */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Thống kê Học phí Theo Lớp Học</CardTitle>
              <CardDescription>Chi tiết doanh thu và tỷ lệ hoàn thành học phí của từng lớp trong năm {selectedYear}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                    <TableRow>
                      <TableHead className="font-semibold text-xs">Lớp học</TableHead>
                      <TableHead className="font-semibold text-xs text-center">Số lượng HĐ</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Đã thu (Thực nhận)</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Còn nợ / Chờ thu</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Tổng phát sinh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classBreakdown.map((c) => (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</TableCell>
                        <TableCell className="text-center">{c.totalCount} phiếu</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {c.paid.toLocaleString('vi-VN')} đ
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {c.pending.toLocaleString('vi-VN')} đ
                        </TableCell>
                        <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                          {(c.paid + c.pending).toLocaleString('vi-VN')} đ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* ================= TAB 2: CÔNG CỤ KÊ KHAI & NGHĨA VỤ THUẾ VIỆT NAM ================= */}
        <TabsContent value="tax" className="space-y-6">
          
          {/* Banner Quy định Pháp luật Việt Nam */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-5 rounded-2xl border border-amber-300 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Căn cứ Pháp lý Thuế Giáo viên / Gia sư (Thông tư 40/2021/TT-BTC & Luật Thuế GTGT)
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              • <b>Thuế GTGT</b>: Hoạt động dạy học, dạy nghề thuộc đối tượng <b>KHÔNG chịu thuế GTGT (0%)</b> theo Khoản 13 Điều 5 Luật Thuế GTGT.<br />
              • <b>Thuế TNCN</b>: Áp dụng mức thuế suất <b>2% trên tổng doanh thu</b> đối với hoạt động giáo dục nếu tổng doanh thu kinh doanh trong năm dương lịch vượt ngưỡng <b>{thresholdLimit.toLocaleString('vi-VN')} đ/năm</b>.<br />
              • <b>Kê khai nộp thuế</b>: Hỗ trợ lập tờ khai theo <b>Mẫu 01/CNKD</b> và nộp online qua ứng dụng <b>eTax Mobile</b> của Tổng cục Thuế.
            </p>
          </div>

          {/* Cấu hình Thông tin Thuế của Giáo viên */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Cấu hình Thông tin Kê khai Thuế
              </CardTitle>
              <CardDescription>Nhập Mã số thuế cá nhân hoặc CCCD để hệ thống tự động điền sẵn tờ khai.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Mã số thuế cá nhân / CCCD</Label>
                  <Input
                    placeholder="VD: 8012345678 hoặc 079..."
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Chi cục Thuế quản lý</Label>
                  <Input
                    placeholder="VD: Chi cục Thuế Quận 1, TP.HCM..."
                    value={taxAuthority}
                    onChange={(e) => setTaxAuthority(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Ngưỡng doanh thu miễn thuế</Label>
                  <Select value={String(thresholdLimit)} onValueChange={(v) => v && setThresholdLimit(Number(v))}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100000000">100.000.000 đ/năm (Hiện hành)</SelectItem>
                      <SelectItem value="200000000">200.000.000 đ/năm (Luật Thuế mới)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  size="sm"
                  onClick={handleSaveTaxSettings}
                  disabled={savingTax}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs"
                >
                  {savingTax && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  <Save className="mr-1.5 h-3.5 w-3.5" /> Lưu Thông tin Thuế
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bảng Tính toán Nghĩa vụ Thuế Năm & Từng Quý */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Bảng Kê Doanh thu & Thuế Từng Quý ({selectedYear})</CardTitle>
                <CardDescription>Căn cứ lập tờ khai thuế Mẫu 01/CNKD theo quý theo Thông tư 40/2021/TT-BTC.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/75">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">Kỳ tính thuế</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Doanh thu thực tế</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Thuế GTGT (0%)</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Thuế TNCN (2%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quarters.map((q, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{q.quarter}</TableCell>
                          <TableCell className="text-right font-bold text-zinc-800 dark:text-zinc-200">
                            {q.revenue.toLocaleString('vi-VN')} đ
                          </TableCell>
                          <TableCell className="text-right text-zinc-500">0 đ (Miễn)</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            {q.taxTncn.toLocaleString('vi-VN')} đ
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Thẻ Tổng kết Thuế Phải Nộp */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-gradient-to-b from-card to-zinc-50/50 dark:to-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-base font-bold">Tổng kết Thuế Năm {selectedYear}</CardTitle>
                <CardDescription>Dự toán nghĩa vụ tài chính với Nhà nước.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-zinc-500">Tổng doanh thu năm:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalPaidRevenue.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="flex justify-between py-1 border-b">
                  <span className="text-zinc-500">Ngưỡng miễn thuế:</span>
                  <span className="font-semibold text-zinc-600">{thresholdLimit.toLocaleString('vi-VN')} đ/năm</span>
                </div>

                <div className="flex justify-between py-1 border-b items-center">
                  <span className="text-zinc-500">Tình trạng thuế:</span>
                  {isTaxable ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Vượt ngưỡng ({Math.round((totalPaidRevenue / thresholdLimit) * 100)}%)
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                      Miễn thuế (Dưới ngưỡng)
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between py-1 border-b">
                  <span className="text-zinc-500">Thuế GTGT (Dạy học):</span>
                  <span className="font-bold text-emerald-600">0 đ (0%)</span>
                </div>

                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 space-y-1">
                  <div className="flex justify-between text-blue-900 dark:text-blue-200 font-medium">
                    <span>Thuế TNCN dự kiến (2%):</span>
                  </div>
                  <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 text-right">
                    {estimatedTaxTncn.toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <Button
                  onClick={handleExportExcel}
                  className="w-full text-xs bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Xuất Bảng kê Kê khai Thuế
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Hướng dẫn từng bước nộp thuế online qua eTax Mobile */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Hướng dẫn Nộp Thuế Điện Tử qua ứng dụng eTax Mobile (Tổng cục Thuế)
              </CardTitle>
              <CardDescription>Quy trình 4 bước đơn giản để kê khai và nộp thuế giáo viên / gia sư từ điện thoại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Đăng nhập eTax Mobile</h4>
                  <p className="text-zinc-500">Tải app eTax Mobile trên App Store / Google Play và đăng nhập bằng CCCD gắn chip hoặc tài khoản VNeID cấp độ 2.</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Chọn Kê khai Thuế</h4>
                  <p className="text-zinc-500">Vào mục <i>"Kê khai thuế"</i> $\rightarrow$ Chọn tờ khai <b>01/CNKD</b> (Cá nhân kinh doanh / Dịch vụ giáo dục).</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Điền Doanh thu</h4>
                  <p className="text-zinc-500">Điền số tiền doanh thu từ Bảng kê Excel của GiasuPro vào mục <i>Dịch vụ không chịu thuế GTGT</i> (Thuế suất TNCN 2%).</p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    4
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Nộp thuế online</h4>
                  <p className="text-zinc-500">Chọn <i>"Nộp thuế"</i> $\rightarrow$ Thanh toán trực tiếp qua tài khoản ngân hàng liên kết trong app là hoàn tất.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
