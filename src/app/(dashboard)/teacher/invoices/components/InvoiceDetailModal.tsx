'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateVietQrUrl } from '@/lib/vietqr';
import { toast } from 'sonner';
import { 
  Printer, 
  Copy, 
  ExternalLink, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  User, 
  BookOpen, 
  CreditCard,
  QrCode,
  Share2
} from 'lucide-react';

interface Props {
  invoice: any | null;
  bankAccount: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (invoice: any) => void;
  onCancelInvoice?: (invoiceId: string) => void;
}

export function InvoiceDetailModal({
  invoice,
  bankAccount,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onCancelInvoice
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  // Parse notes if JSON
  let lineItems: any[] = [];
  let customNotes: string | null = null;
  let templateSnapshot: any = null;
  let paymentToken = invoice.payment_token || invoice.id.replace(/-/g, '');

  if (invoice.notes) {
    try {
      if (invoice.notes.startsWith('{')) {
        const parsed = JSON.parse(invoice.notes);
        lineItems = parsed.line_items || [];
        customNotes = parsed.custom_notes || null;
        templateSnapshot = parsed.template_snapshot || null;
        if (parsed.payment_token) paymentToken = parsed.payment_token;
      } else if (invoice.notes.startsWith('[')) {
        lineItems = JSON.parse(invoice.notes);
      } else {
        customNotes = invoice.notes;
      }
    } catch (e) {
      customNotes = invoice.notes;
    }
  }

  if (lineItems.length === 0) {
    lineItems = [{
      description: 'Học phí khóa học',
      quantity: invoice.sessions_count || 1,
      unitPrice: Number(invoice.unit_price) || Number(invoice.subtotal) || 0,
      amount: Number(invoice.subtotal) || Number(invoice.total_amount) || 0
    }];
  }

  const studentName = invoice.students?.full_name || invoice.profiles?.full_name || 'Học sinh';
  const className = invoice.classes?.name || 'Lớp học';
  const brandName = templateSnapshot?.brandName || 'GiasuPro Education';
  const contactPhone = templateSnapshot?.contactPhone || '';
  const noteMessage = templateSnapshot?.noteMessage || 'Cảm ơn Quý phụ huynh và học sinh đã tin tưởng đồng hành cùng thầy cô!';
  const themeColor = templateSnapshot?.themeColor || '#3B82F6';

  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invoices/view/${paymentToken}`
    : `/invoices/view/${paymentToken}`;

  // Sinh mã VietQR nếu có tài khoản ngân hàng
  const vietQrUrl = bankAccount ? generateVietQrUrl({
    bankName: bankAccount.bank_name,
    accountNumber: bankAccount.account_number,
    accountName: bankAccount.account_name,
    amount: Number(invoice.total_amount),
    memo: `${invoice.invoice_number}`
  }) : null;

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Đã sao chép link hóa đơn công khai! Bạn có thể gửi cho phụ huynh qua Zalo/Tin nhắn.');
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-0 shadow-2xl">
        <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 print:p-0">
          
          {/* Thanh Toolbar thao tác trên đầu */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-500">Mã phiếu:</span>
              <span className="font-mono font-bold text-sm bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                {invoice.invoice_number}
              </span>
              {isPaid && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã thu
                </Badge>
              )}
              {invoice.status === 'sent' && (
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50/50">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Chờ thanh toán
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Quá hạn
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isPaid && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenRecordPayment(invoice);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <Banknote className="w-3.5 h-3.5 mr-1.5" /> Thu tiền mặt / Chuyển khoản
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> {copied ? 'Đã sao chép' : 'Gửi Phụ huynh (Link)'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(publicUrl, '_blank')}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> In phiếu
              </Button>
            </div>
          </div>

          {/* Mẫu Hóa đơn chính (Phiếu Thu Điện Tử) */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            
            {/* Header Thương hiệu */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{brandName}</h2>
                    {contactPhone && <p className="text-xs text-zinc-500">Hotline / Zalo: {contactPhone}</p>}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <h1 className="text-xl font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100" style={{ color: themeColor }}>
                  HÓA ĐƠN HỌC PHÍ
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">Số: {invoice.invoice_number}</p>
                <p className="text-xs text-zinc-500">
                  Ngày lập: {new Date(invoice.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>

            {/* Thông tin học sinh & Lớp học */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/75 dark:bg-zinc-950/50 p-4 rounded-xl text-xs border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Học sinh:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Lớp học:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{className}</span>
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <div className="flex sm:justify-end items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Kỳ học:</span>
                  <span className="font-semibold">
                    {new Date(invoice.period_start).toLocaleDateString('vi-VN')} - {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex sm:justify-end items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-500">Hạn thanh toán:</span>
                  <span className="font-semibold text-amber-600">
                    {new Date(invoice.due_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Bảng kê chi tiết học phí */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-800/60">
                  <TableRow>
                    <TableHead className="w-[45%] text-xs font-semibold">Nội dung khoản thu</TableHead>
                    <TableHead className="text-center text-xs font-semibold w-[15%]">Số buổi / SL</TableHead>
                    <TableHead className="text-right text-xs font-semibold w-[20%]">Đơn giá</TableHead>
                    <TableHead className="text-right text-xs font-semibold w-[20%]">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.unitPrice?.amount ?? item.unitPrice ?? 0).toLocaleString('vi-VN')} đ
                      </TableCell>
                      <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {Number(item.amount?.amount ?? item.amount ?? 0).toLocaleString('vi-VN')} đ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Tổng kết tài chính & VietQR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Bên trái: Mã VietQR hoặc thông tin đã thanh toán */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
                {isPaid ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Hóa đơn đã được thanh toán</h4>
                    <p className="text-xs text-zinc-500">
                      Thời gian: {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString('vi-VN') : 'Đã ghi nhận'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Hình thức: {invoice.payment_method === 'cash' ? '💵 Tiền mặt' : '💳 Chuyển khoản ngân hàng'}
                    </p>
                  </div>
                ) : vietQrUrl ? (
                  <div className="flex flex-col lg:flex-row items-center gap-6 p-2">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Học phí"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-2xl border border-zinc-200 shadow-md bg-white p-2"
                    />
                    <div className="space-y-1.5 text-sm text-center lg:text-left">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center lg:justify-start gap-1 text-base">
                        <QrCode className="w-5 h-5 text-blue-600" /> Quét mã thanh toán
                      </div>
                      <p className="text-zinc-500">Ngân hàng: <b>{bankAccount.bank_name}</b></p>
                      <p className="text-zinc-500">STK: <b className="font-mono text-zinc-900 dark:text-zinc-100 text-base">{bankAccount.account_number}</b></p>
                      <p className="text-zinc-500">Chủ TK: <b>{bankAccount.account_name}</b></p>
                      <p className="text-[12px] text-emerald-600 font-semibold mt-2 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg inline-block">
                        App ngân hàng sẽ tự điền đúng số tiền và cú pháp
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-zinc-500">
                    Chưa cài đặt tài khoản ngân hàng để tạo mã QR.
                  </div>
                )}
              </div>

              {/* Bên phải: Bảng cộng tổng */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b text-zinc-600 dark:text-zinc-400">
                  <span>Tạm tính:</span>
                  <span className="font-semibold">{Number(invoice.subtotal).toLocaleString('vi-VN')} đ</span>
                </div>
                {Number(invoice.discount) > 0 && (
                  <div className="flex justify-between py-1 border-b text-red-600">
                    <span>Giảm trừ / Học bổng:</span>
                    <span className="font-semibold">-{Number(invoice.discount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {Number(invoice.extra_fee) > 0 && (
                  <div className="flex justify-between py-1 border-b text-zinc-600">
                    <span>Phụ thu / Tài liệu:</span>
                    <span className="font-semibold">+{Number(invoice.extra_fee).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b-2 border-zinc-900 dark:border-zinc-100 text-sm font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">Tổng thanh toán:</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {Number(invoice.total_amount).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {customNotes && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/50 text-[11px] text-amber-900 dark:text-amber-200 mt-2">
                    <b>Ghi chú:</b> {customNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Lời cảm ơn chân trang */}
            <div className="text-center border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs text-zinc-500 italic">
              "{noteMessage}"
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
