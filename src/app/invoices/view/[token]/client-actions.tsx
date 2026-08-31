'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  memo: string;
}

export function PublicInvoiceClientActions({
  bankName,
  accountNumber,
  accountName,
  amount,
  memo
}: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reportedTransfer, setReportedTransfer] = useState(false);

  function handleCopy(text: string, fieldName: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleReportTransfer() {
    setReportedTransfer(true);
    toast.success('Đã gửi thông báo cho giáo viên! Thầy/cô sẽ kiểm tra và xác nhận biên nhận sớm nhất.');
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <button
          type="button"
          onClick={() => handleCopy(accountNumber, 'acc', 'Số tài khoản')}
          className="flex items-center justify-between p-2.5 rounded-xl border bg-white dark:bg-zinc-900 hover:border-blue-400 transition-colors shadow-sm text-left"
        >
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Số tài khoản ({bankName})</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{accountNumber}</div>
          </div>
          {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>

        <button
          type="button"
          onClick={() => handleCopy(String(amount), 'amount', 'Số tiền')}
          className="flex items-center justify-between p-2.5 rounded-xl border bg-white dark:bg-zinc-900 hover:border-blue-400 transition-colors shadow-sm text-left"
        >
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Số tiền</div>
            <div className="font-mono font-bold text-emerald-600">{amount.toLocaleString('vi-VN')} đ</div>
          </div>
          {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>

        <button
          type="button"
          onClick={() => handleCopy(memo, 'memo', 'Nội dung CK')}
          className="flex items-center justify-between p-2.5 rounded-xl border bg-white dark:bg-zinc-900 hover:border-blue-400 transition-colors shadow-sm text-left"
        >
          <div>
            <div className="text-[10px] text-zinc-400 font-medium">Nội dung chuyển khoản</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{memo}</div>
          </div>
          {copiedField === 'memo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReportTransfer}
          disabled={reportedTransfer}
          className={`w-full text-xs font-semibold py-2.5 rounded-xl transition-all ${
            reportedTransfer 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
              : 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
          }`}
        >
          {reportedTransfer ? (
            <span className="flex items-center gap-1.5 justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Đã gửi thông báo đã chuyển khoản cho giáo viên
            </span>
          ) : (
            'Tôi đã chuyển khoản xong (Báo cho giáo viên)'
          )}
        </Button>
      </div>
    </div>
  );
}
