'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTeacherClassesAction, getClassStudentsAction, createCustomInvoiceAction } from '../actions';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LineItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export function CreateCustomModal({ isOpen, onClose, onSuccess }: Props) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const defaultDue = new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState<string>(defaultStart);
  const [periodEnd, setPeriodEnd] = useState<string>(defaultEnd);
  const [dueDate, setDueDate] = useState<string>(defaultDue);
  const [notes, setNotes] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [extraFee, setExtraFee] = useState<number>(0);

  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { id: '1', description: 'Học phí theo yêu cầu', quantity: 4, unitPrice: 150000, amount: 600000 }
  ]);

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  async function loadClasses() {
    setLoadingClasses(true);
    try {
      const cls = await getTeacherClassesAction();
      setClasses(cls);
      if (cls.length > 0) {
        setSelectedClassId(cls[0].id);
      }
    } catch (err: any) {
      toast.error('Lỗi tải danh sách lớp: ' + err.message);
    } finally {
      setLoadingClasses(false);
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  async function loadStudents(classId: string) {
    setLoadingStudents(true);
    try {
      const studs = await getClassStudentsAction(classId);
      setStudents(studs);
      if (studs.length > 0) {
        setSelectedStudentId(studs[0].studentId);
        
        // Cập nhật đơn giá mặc định
        const selectedCls = classes.find(c => c.id === classId);
        const fee = studs[0].customFee || selectedCls?.fee_per_session || 150000;
        setLineItems([
          { id: '1', description: `Học phí khóa/kỳ (${selectedCls?.name || ''})`, quantity: 4, unitPrice: Number(fee), amount: 4 * Number(fee) }
        ]);
      } else {
        setSelectedStudentId('');
      }
    } catch (err: any) {
      toast.error('Lỗi tải danh sách học sinh: ' + err.message);
    } finally {
      setLoadingStudents(false);
    }
  }

  function handleAddLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: String(Date.now()), description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]);
  }

  function handleRemoveLineItem(id: string) {
    if (lineItems.length <= 1) {
      toast.error('Hóa đơn cần có ít nhất một dòng chi phí');
      return;
    }
    setLineItems(prev => prev.filter(item => item.id !== id));
  }

  function handleLineItemChange(id: string, field: string, value: any) {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const q = Number(updated.quantity) || 0;
      const u = Number(updated.unitPrice) || 0;
      updated.amount = q * u;
      return updated;
    }));
  }

  // Chọn nhanh preset trường hợp đặc biệt
  function applyPreset(preset: 'half_month' | 'extra_tutoring' | 'materials') {
    const selectedCls = classes.find(c => c.id === selectedClassId);
    const fee = Number(selectedCls?.fee_per_session) || 150000;

    if (preset === 'half_month') {
      const halfEnd = new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0];
      setPeriodEnd(halfEnd);
      setLineItems([
        { id: '1', description: 'Học phí nửa tháng (học đến ngày 15 rồi dừng)', quantity: 4, unitPrice: fee, amount: 4 * fee }
      ]);
      setNotes('Trường hợp đặc biệt: Học sinh chỉ theo học nửa tháng.');
    } else if (preset === 'extra_tutoring') {
      setLineItems([
        { id: '1', description: 'Học phí các buổi phụ đạo & ôn thi tăng cường', quantity: 3, unitPrice: fee, amount: 3 * fee }
      ]);
      setNotes('Bồi dưỡng kiến thức bổ trợ.');
    } else if (preset === 'materials') {
      setLineItems(prev => [
        ...prev,
        { id: String(Date.now()), description: 'Bộ tài liệu giáo trình & đề thi thử độc quyền', quantity: 1, unitPrice: 150000, amount: 150000 }
      ]);
    }
  }

  const subtotal = lineItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const totalAmount = Math.max(0, subtotal - (Number(discount) || 0) + (Number(extraFee) || 0));
  const totalSessions = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  const currentSelectedClass = classes.find(c => c.id === selectedClassId);
  const currentSelectedStudent = students.find(s => s.studentId === selectedStudentId);

  async function handleCreate() {
    if (!selectedClassId) {
      toast.error('Vui lòng chọn lớp học');
      return;
    }
    if (!selectedStudentId) {
      toast.error('Vui lòng chọn học sinh nhận hóa đơn');
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error('Vui lòng chọn kỳ học (Từ ngày - Đến ngày)');
      return;
    }
    if (lineItems.length === 0 || lineItems.some(i => !i.description.trim() || i.amount <= 0)) {
      toast.error('Vui lòng kiểm tra lại các mục chi phí (tên và số tiền không được để trống)');
      return;
    }

    setSubmitting(true);
    try {
      await createCustomInvoiceAction({
        classId: selectedClassId,
        studentId: selectedStudentId,
        periodStart,
        periodEnd,
        sessionsCount: totalSessions,
        lineItems: lineItems.map(i => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          amount: Number(i.amount),
        })),
        discount: Number(discount) || 0,
        extraFee: Number(extraFee) || 0,
        notes,
        dueDate
      });

      toast.success('Đã tạo và gửi hóa đơn thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi khi tạo hóa đơn: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-bold">
            Tạo Hóa đơn Theo Yêu Cầu / Tình Huống Đặc Biệt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Presets nhanh - thiết kế gọn đẹp trên 1 dòng */}
          <div className="flex items-center gap-2 p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 shrink-0">Gợi ý nhanh:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('half_month')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-muted border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs"
              >
                Học nửa tháng rồi dừng
              </button>
              <button
                type="button"
                onClick={() => applyPreset('extra_tutoring')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-muted border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs"
              >
                Học kèm / Phụ đạo riêng
              </button>
              <button
                type="button"
                onClick={() => applyPreset('materials')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-background hover:bg-muted border border-zinc-200 dark:border-zinc-700 transition-colors shadow-2xs"
              >
                Tiền Tài liệu / Đề thi
              </button>
            </div>
          </div>

          {/* Chọn Lớp & Học sinh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Lớp học</Label>
              <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v || '')} disabled={loadingClasses}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Chọn lớp">
                    {currentSelectedClass?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Học sinh nhận hóa đơn</Label>
              <Select value={selectedStudentId} onValueChange={(v) => setSelectedStudentId(v || '')} disabled={loadingStudents || students.length === 0}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder={students.length === 0 ? "Không có học sinh" : "Chọn học sinh"}>
                    {currentSelectedStudent ? `${currentSelectedStudent.fullName}${currentSelectedStudent.phone ? ` (${currentSelectedStudent.phone})` : ''}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.fullName} {s.phone ? `(${s.phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Khoảng thời gian kỳ học & Hạn thanh toán */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Từ ngày</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Đến ngày</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Hạn thanh toán</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
          </div>

          {/* Chi tiết các dòng mục (Line Items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Các mục chi phí / Học phí</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem} className="text-xs h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm dòng mục
              </Button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-card">
                  <div className="flex-1">
                    <Input
                      placeholder="Nội dung khoản thu (VD: Học phí nửa tháng...)"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Số buổi"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                      className="text-xs h-8 text-center"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Đơn giá"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))}
                      className="text-xs h-8 text-right font-mono"
                    />
                  </div>
                  <div className="w-28 text-right font-bold text-xs text-zinc-900 dark:text-zinc-100 font-mono">
                    {item.amount.toLocaleString('vi-VN')} đ
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Chiết khấu, Phụ thu & Tổng kết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Ghi chú thêm trên hóa đơn</Label>
                <Textarea
                  rows={2}
                  placeholder="VD: Đã trừ 1 buổi nghỉ có phép ngày 12/08..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Tổng tiền các mục:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-500">Giảm giá / Miễn giảm:</span>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="text-xs h-7 text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-500">Phụ thu (nếu có):</span>
                <div className="w-28">
                  <Input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="0"
                    value={extraFee || ''}
                    onChange={(e) => setExtraFee(Number(e.target.value) || 0)}
                    className="text-xs h-7 text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-700 font-bold text-sm">
                <span className="text-zinc-900 dark:text-zinc-100">Tổng thanh toán:</span>
                <span className="text-primary text-base font-bold">{totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="text-xs h-9">
            Hủy
          </Button>
          <Button onClick={handleCreate} disabled={submitting || loadingClasses || loadingStudents} className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-9">
            {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Tạo & Gửi Hóa đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
