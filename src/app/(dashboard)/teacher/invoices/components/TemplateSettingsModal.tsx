'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getInvoiceTemplateAction, saveInvoiceTemplateAction } from '../actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const THEME_COLORS = [
  { id: '#3B82F6', name: 'Xanh dương (Chuẩn)', bg: 'bg-blue-600' },
  { id: '#059669', name: 'Xanh ngọc (Emerald)', bg: 'bg-emerald-600' },
  { id: '#EA580C', name: 'Cam đất (Warm Orange)', bg: 'bg-orange-600' },
  { id: '#7C3AED', name: 'Tím hiện đại (Violet)', bg: 'bg-violet-600' },
  { id: '#18181B', name: 'Kẽm sang trọng (Zinc)', bg: 'bg-zinc-900' },
];

export function TemplateSettingsModal({ isOpen, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [noteMessage, setNoteMessage] = useState('Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!');
  const [themeColor, setThemeColor] = useState('#3B82F6');
  const [showAttendanceLog, setShowAttendanceLog] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getInvoiceTemplateAction();
      setBrandName(data.template.brand_name || data.profile?.full_name || '');
      setLogoUrl(data.template.logo_url || data.profile?.avatar_url || '');
      setContactPhone(data.template.contact_phone || data.profile?.phone || '');
      setContactEmail(data.template.contact_email || data.profile?.email || '');
      setAddress(data.template.address || '');
      setNoteMessage(data.template.note_message || 'Cảm ơn Quý phụ huynh và học sinh đã đồng hành cùng thầy cô!');
      setThemeColor(data.template.theme_color || '#3B82F6');
      setShowAttendanceLog(data.template.show_attendance_log !== false);
      setBankAccounts(data.bankAccounts);
      setSelectedBankId(data.template.bank_account_id || data.bankAccounts?.[0]?.id || '');
    } catch (err: any) {
      toast.error('Lỗi khi tải cấu hình mẫu hóa đơn: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!brandName.trim()) {
      toast.error('Vui lòng nhập tên hiển thị / thương hiệu trên hóa đơn');
      return;
    }

    setSaving(true);
    try {
      await saveInvoiceTemplateAction({
        brand_name: brandName,
        logo_url: logoUrl,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        address,
        note_message: noteMessage,
        theme_color: themeColor,
        show_attendance_log: showAttendanceLog,
        bank_account_id: selectedBankId || null,
      });

      toast.success('Đã lưu cấu hình mẫu hóa đơn thành công!');
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-bold">
            Tùy biến Mẫu Hóa đơn Học phí
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Thông tin thương hiệu */}
            <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Thông tin Giáo viên / Lớp học
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tên Giáo viên / Trung tâm <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="VD: Thầy Tài Toán 11, CLB Gia Sư..."
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Link Logo / Ảnh đại diện (URL)</Label>
                  <Input
                    placeholder="https://... hoặc để trống"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Số điện thoại liên hệ</Label>
                  <Input
                    placeholder="VD: 0912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email liên hệ</Label>
                  <Input
                    placeholder="VD: giaovien@gmail.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Địa chỉ / Khu vực dạy</Label>
                <Input
                  placeholder="VD: Quận 1, TP. Hồ Chí Minh hoặc Lớp học Online"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* Tài khoản nhận tiền cho mã VietQR */}
            <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Tài khoản Nhận tiền (Tự động tạo VietQR)
              </h4>
              {bankAccounts.length === 0 ? (
                <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200">
                  Bạn chưa thêm số tài khoản ngân hàng. Hãy vào mục <b>Hồ sơ cá nhân</b> để thêm tài khoản ngân hàng giúp hệ thống tự động sinh mã VietQR quét trả học phí!
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Chọn tài khoản nhận học phí</Label>
                  <Select value={selectedBankId} onValueChange={(v) => setSelectedBankId(v || '')}>
                    <SelectTrigger className="w-full text-xs h-9">
                      <SelectValue placeholder="Chọn tài khoản ngân hàng">
                        {bankAccounts.find(b => b.id === selectedBankId)
                          ? `${bankAccounts.find(b => b.id === selectedBankId)?.bank_name} - ${bankAccounts.find(b => b.id === selectedBankId)?.account_number} (${bankAccounts.find(b => b.id === selectedBankId)?.account_name})`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bank_name} - {b.account_number} ({b.account_name}) {b.is_default ? '⭐ Mặc định' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-zinc-500">Mã VietQR chuẩn NAPAS 247 sẽ tự động điền đúng STK này và số tiền của hóa đơn.</p>
                </div>
              )}
            </div>

            {/* Tùy chỉnh màu sắc & Lời nhắn */}
            <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Màu sắc & Lời nhắn
              </h4>

              <div className="space-y-2">
                <Label className="text-xs">Màu sắc chủ đạo của hóa đơn</Label>
                <div className="flex flex-wrap gap-2.5">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setThemeColor(c.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        themeColor === c.id
                          ? 'border-zinc-900 dark:border-zinc-100 font-semibold ring-2 ring-primary/20 bg-background'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-background/50'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Lời nhắn cảm ơn / Hướng dẫn ở chân hóa đơn</Label>
                <Textarea
                  rows={2}
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  placeholder="VD: Cảm ơn Quý phụ huynh đã đồng hành cùng thầy cô trong suốt tháng qua..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="showAttendance"
                  checked={showAttendanceLog}
                  onCheckedChange={(checked) => setShowAttendanceLog(!!checked)}
                />
                <label
                  htmlFor="showAttendance"
                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Đính kèm bảng chi tiết các buổi học & điểm danh trên hóa đơn (để phụ huynh dễ đối soát)
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="text-xs h-9">
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="h-9 text-xs">
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Lưu Cấu hình Mẫu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
