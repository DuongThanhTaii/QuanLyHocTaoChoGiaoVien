'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt, 
  Plus, 
  Palette, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Banknote, 
  Share2, 
  Eye, 
  Trash2, 
  DollarSign,
  QrCode,
  FileSpreadsheet
} from 'lucide-react';
import { GenerateBatchModal } from './GenerateBatchModal';
import { CreateCustomModal } from './CreateCustomModal';
import { TemplateSettingsModal } from './TemplateSettingsModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { deleteInvoiceAction, cancelInvoiceAction } from '../actions';
import { toast } from 'sonner';

interface Props {
  invoices: any[];
  classes: any[];
  bankAccount: any | null;
}

export function InvoiceListClient({ invoices: initialInvoices, classes, bankAccount }: Props) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);

  // Modals state
  const [openBatchModal, setOpenBatchModal] = useState(false);
  const [openCustomModal, setOpenCustomModal] = useState(false);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Stats calculation
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const totalPending = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'draft')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  const totalOverdue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const studentName = inv.students?.full_name || inv.profiles?.full_name || '';
    const invoiceNum = inv.invoice_number || '';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoiceNum.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = selectedClassFilter === 'ALL' || inv.class_id === selectedClassFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || inv.status === selectedStatusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  async function handleDelete(invoiceId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn nháp này?')) return;
    try {
      await deleteInvoiceAction(invoiceId);
      setInvoices(prev => prev.filter(i => i.id !== invoiceId));
      toast.success('Đã xóa hóa đơn thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi xóa hóa đơn: ' + err.message);
    }
  }

  function handleCopyShareLink(inv: any) {
    let paymentToken = inv.payment_token || inv.id.replace(/-/g, '');
    if (inv.notes && inv.notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(inv.notes);
        if (parsed.payment_token) paymentToken = parsed.payment_token;
      } catch (e) {}
    }

    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/invoices/view/${paymentToken}`
      : `/invoices/view/${paymentToken}`;

    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép link hóa đơn công khai! Bạn có thể gửi cho phụ huynh qua Zalo/Tin nhắn.');
  }

  return (
    <div className="space-y-6">
      {/* Header & Thao tác chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quản lý Hóa đơn & Học phí
          </h1>
        </div>

        {/* Cụm nút thao tác gọn gàng, hài hòa */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            onClick={() => setOpenTemplateModal(true)}
            className="h-9 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <Palette className="mr-1.5 h-3.5 w-3.5 text-purple-600" /> Tùy biến Mẫu HĐ
          </Button>

          <Button
            variant="outline"
            onClick={() => setOpenCustomModal(true)}
            className="h-9 px-3 text-xs font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Tạo HĐ Theo Yêu Cầu
          </Button>

          <Button
            onClick={() => setOpenBatchModal(true)}
            className="h-9 px-3.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-sm"
          >
            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Sinh Hóa đơn Tự động
          </Button>
        </div>
      </div>

      {/* 4 Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Đã thu (Thực nhận)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {totalPaid.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Đã vào tài khoản hoặc tiền mặt</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Chờ thanh toán</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalPending.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Phụ huynh đang đối soát / chưa đóng</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Quá hạn</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalOverdue.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Cần gửi tin nhắn nhắc học phí</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Tổng số hóa đơn</span>
              <Receipt className="w-4 h-4 text-zinc-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {invoices.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Học sinh được quản lý học phí</p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng Danh sách Hóa đơn & Bộ lọc */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-1">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Danh sách Hóa đơn
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Các phiếu thu học phí đã phát hành hoặc đang chờ xử lý.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-4">
          {/* Thanh tìm kiếm & Bộ lọc riêng biệt bên dưới */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm theo tên học sinh, mã hóa đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9 bg-background"
              />
            </div>

            <div className="w-full sm:w-52">
              <Select value={selectedClassFilter} onValueChange={(v) => setSelectedClassFilter(v || 'ALL')}>
                <SelectTrigger className="text-xs h-9 w-full bg-background">
                  <SelectValue>
                    {selectedClassFilter === 'ALL'
                      ? 'Tất cả lớp học'
                      : classes.find(c => c.id === selectedClassFilter)?.name || 'Tất cả lớp học'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả lớp học</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-44">
              <Select value={selectedStatusFilter} onValueChange={(v) => setSelectedStatusFilter(v || 'ALL')}>
                <SelectTrigger className="text-xs h-9 w-full bg-background">
                  <SelectValue>
                    {selectedStatusFilter === 'ALL' ? 'Tất cả trạng thái' :
                     selectedStatusFilter === 'paid' ? 'Đã thu tiền' :
                     selectedStatusFilter === 'sent' ? 'Chờ thanh toán' :
                     selectedStatusFilter === 'overdue' ? 'Quá hạn' : 'Bản nháp'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="paid">Đã thu tiền</SelectItem>
                  <SelectItem value="sent">Chờ thanh toán</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed rounded-xl space-y-3">
              <Receipt className="w-10 h-10 mx-auto text-zinc-300" />
              <p className="text-sm font-medium">Chưa có hóa đơn nào phù hợp với bộ lọc.</p>
              <p className="text-xs text-zinc-400">Bấm nút "Sinh Hóa đơn Tự động" để bắt đầu tính học phí cho học sinh.</p>
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Mã HĐ</TableHead>
                    <TableHead className="font-semibold text-xs">Học sinh</TableHead>
                    <TableHead className="font-semibold text-xs">Lớp học</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Số buổi</TableHead>
                    <TableHead className="font-semibold text-xs">Kỳ học</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Tổng tiền</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const studentName = inv.students?.full_name || inv.profiles?.full_name || 'Học sinh';
                    const className = inv.classes?.name || 'Lớp học';
                    const isPaid = inv.status === 'paid';

                    return (
                      <TableRow key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                        <TableCell className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{studentName}</div>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                          {className}
                        </TableCell>
                        <TableCell className="text-xs text-center font-medium">
                          {inv.sessions_count || 1} buổi
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {new Date(inv.period_start).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {Number(inv.total_amount).toLocaleString('vi-VN')} đ
                          {Number(inv.discount) > 0 && (
                            <span className="block text-[10px] font-normal text-red-500">
                              (Đã giảm {Number(inv.discount).toLocaleString('vi-VN')}đ)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isPaid && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[11px]">
                              Đã thu {inv.payment_method === 'cash' ? '💵' : '💳'}
                            </Badge>
                          )}
                          {inv.status === 'sent' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50/50 text-[11px]">
                              Chờ đóng
                            </Badge>
                          )}
                          {inv.status === 'overdue' && (
                            <Badge variant="destructive" className="text-[11px]">
                              Quá hạn
                            </Badge>
                          )}
                          {inv.status === 'draft' && (
                            <Badge variant="secondary" className="text-[11px]">
                              Nháp
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setOpenDetailModal(true);
                              }}
                              className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                              title="Xem phiếu thu"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Nút Thu tiền mặt / Chuyển khoản (nếu chưa thu) */}
                            {!isPaid && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setPaymentInvoice(inv);
                                  setOpenPaymentModal(true);
                                }}
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                title="Ghi nhận thu tiền mặt / Chuyển khoản"
                              >
                                <Banknote className="w-4 h-4" />
                              </Button>
                            )}

                            {/* Nút Copy Link gửi Phụ huynh */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyShareLink(inv)}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                              title="Sao chép link gửi Phụ huynh"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>

                            {/* Nút xóa bản nháp */}
                            {inv.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(inv.id)}
                                className="h-8 w-8 text-zinc-400 hover:text-red-600"
                                title="Xóa hóa đơn nháp"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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

      {/* Modals */}
      <GenerateBatchModal
        isOpen={openBatchModal}
        onClose={() => setOpenBatchModal(false)}
        onSuccess={() => window.location.reload()}
      />

      <CreateCustomModal
        isOpen={openCustomModal}
        onClose={() => setOpenCustomModal(false)}
        onSuccess={() => window.location.reload()}
      />

      <TemplateSettingsModal
        isOpen={openTemplateModal}
        onClose={() => setOpenTemplateModal(false)}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        bankAccount={bankAccount}
        isOpen={openDetailModal}
        onClose={() => {
          setOpenDetailModal(false);
          setSelectedInvoice(null);
        }}
        onOpenRecordPayment={(inv) => {
          setPaymentInvoice(inv);
          setOpenPaymentModal(true);
        }}
      />

      <RecordPaymentModal
        invoice={paymentInvoice}
        isOpen={openPaymentModal}
        onClose={() => {
          setOpenPaymentModal(false);
          setPaymentInvoice(null);
        }}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
