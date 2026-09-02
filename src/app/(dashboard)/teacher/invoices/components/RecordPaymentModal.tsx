'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recordPaymentAction } from '../actions';
import { toast } from 'sonner';
import { Banknote, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { PaymentMethod } from '@/domains/payment/entities/invoice';

interface Props {
  invoice: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({ invoice, isOpen, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState<number>(invoice ? Number(invoice.total_amount) : 0);
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sync amount when invoice changes
  if (invoice && amount === 0 && Number(invoice.total_amount) > 0) {
    setAmount(Number(invoice.total_amount));
  }

  async function handleConfirm() {
    if (!invoice) return;
    if (amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await recordPaymentAction({
        invoiceId: invoice.id,
        amount: Number(amount),
        paymentMethod: method,
        paymentReference: reference || undefined,
        note: note || undefined
      });

      toast.success(`Đã xác nhận thanh toán ${Number(amount).toLocaleString('vi-VN')} đ (${method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi xác nhận thanh toán: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!invoice) return null;

  const studentName = invoice.students?.full_name || invoice.profiles?.full_name || 'Học sinh';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Xác nhận Thu Tiền Học Phí
          </DialogTitle>
          <DialogDescription className="hidden">
            Xác nhận thanh toán
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thông tin tóm tắt hóa đơn */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Mã hóa đơn:</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Học sinh:</span>
              <span className="font-semibold">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Số tiền hóa đơn:</span>
              <span className="font-bold text-emerald-600">{Number(invoice.total_amount).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-2">
            <Label>Hình thức thanh toán</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  method === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <Banknote className="w-4 h-4" /> Tiền mặt (Cash)
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  method === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 ring-2 ring-blue-600/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Chuyển khoản
              </button>
            </div>
          </div>

          {/* Số tiền thực nhận */}
          <div className="space-y-2">
            <Label>Số tiền thực nhận (VNĐ)</Label>
            <Input
              type="number"
              min="0"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-base font-bold text-emerald-600"
            />
          </div>

          {/* Mã giao dịch / Chứng từ (nếu có) */}
          {method === 'bank_transfer' && (
            <div className="space-y-2">
              <Label>Mã giao dịch ngân hàng (tùy chọn)</Label>
              <Input
                placeholder="VD: FT24081234567..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          )}

          {/* Ghi chú */}
          <div className="space-y-2">
            <Label>Ghi chú biên nhận</Label>
            <Textarea
              rows={2}
              placeholder="VD: Phụ huynh đã đóng tiền mặt tại lớp..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận Đã Thu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
