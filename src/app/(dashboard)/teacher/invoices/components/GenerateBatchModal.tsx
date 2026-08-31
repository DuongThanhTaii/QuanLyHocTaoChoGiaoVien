'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getTeacherClassesAction, getMonthlyBillingPreviewAction, generateBatchInvoicesAction } from '../actions';
import { toast } from 'sonner';
import { Receipt, Calendar, Users, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GenerateBatchModal({ isOpen, onClose, onSuccess }: Props) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Danh sách preview các học sinh
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

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
      if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0].id);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách lớp: ' + err.message);
    } finally {
      setLoadingClasses(false);
    }
  }

  // Khi chọn lớp hoặc đổi tháng/năm -> Lấy bảng preview tính toán
  useEffect(() => {
    if (isOpen && selectedClassId) {
      fetchPreview();
    }
  }, [isOpen, selectedClassId, month, year]);

  async function fetchPreview() {
    setPreviewLoading(true);
    try {
      const data = await getMonthlyBillingPreviewAction(selectedClassId, month, year);
      setPreviewItems(data);
      // Mặc định chọn tất cả học sinh chưa có hóa đơn
      const initialSelected = new Set<string>();
      data.forEach((item: any) => {
        if (!item.hasExistingInvoice) {
          initialSelected.add(item.studentId);
        }
      });
      setSelectedStudentIds(initialSelected);
    } catch (err: any) {
      toast.error('Lỗi khi tính toán học phí: ' + err.message);
      setPreviewItems([]);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleToggleStudent(studentId: string) {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  }

  function handleToggleAll() {
    if (selectedStudentIds.size === previewItems.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(previewItems.map(p => p.studentId)));
    }
  }

  function handleItemChange(studentId: string, field: string, value: any) {
    setPreviewItems(prev => prev.map(item => {
      if (item.studentId !== studentId) return item;
      const updated = { ...item, [field]: value };
      
      const sessions = Number(updated.effectiveSessions) || 0;
      const unit = Number(updated.unitPrice) || 0;
      const disc = Number(updated.discount) || 0;
      const extra = Number(updated.extraFee) || 0;

      const subtotal = sessions * unit;
      const total = Math.max(0, subtotal - disc + extra);
      return {
        ...updated,
        subtotal,
        totalAmount: total
      };
    }));
  }

  async function handleGenerate() {
    if (selectedStudentIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh để sinh hóa đơn');
      return;
    }

    const itemsToGenerate = previewItems
      .filter(item => selectedStudentIds.has(item.studentId))
      .map(item => ({
        studentId: item.studentId,
        sessionsCount: Number(item.effectiveSessions) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        extraFee: Number(item.extraFee) || 0,
        notes: item.notes || undefined
      }));

    setGenerating(true);
    try {
      const res = await generateBatchInvoicesAction({
        classId: selectedClassId,
        month,
        year,
        items: itemsToGenerate
      });

      toast.success(`Đã sinh thành công ${res.count} hóa đơn và gửi thông báo cho phụ huynh!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Lỗi khi sinh hóa đơn: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const totalSelectedAmount = previewItems
    .filter(i => selectedStudentIds.has(i.studentId))
    .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Sinh Hóa đơn Tự động theo Lớp
          </DialogTitle>
          <DialogDescription>
            Hệ thống tự động quét nhật ký điểm danh trong tháng, tính toán chính xác số buổi học và học phí cho từng học sinh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Bộ chọn Lớp & Kỳ học */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> Lớp học</Label>
              <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v || '')} disabled={loadingClasses || previewLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({Number(cls.fee_per_session).toLocaleString('vi-VN')} đ/buổi)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-500" /> Tháng</Label>
              <Select value={String(month)} onValueChange={(v) => v && setMonth(Number(v))} disabled={previewLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      Tháng {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-500" /> Năm</Label>
              <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))} disabled={previewLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bảng Preview tính toán */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Bảng Tính toán Học phí Dự kiến ({previewItems.length} học sinh)
                </h4>
                {selectedClass && (
                  <Badge variant="outline" className="text-xs">
                    Đơn giá chuẩn: {Number(selectedClass.fee_per_session).toLocaleString('vi-VN')} đ/buổi
                  </Badge>
                )}
              </div>

              {previewItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleToggleAll} className="text-xs">
                  {selectedStudentIds.size === previewItems.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              )}
            </div>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-2 border rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Đang quét điểm danh và tính toán học phí...</p>
              </div>
            ) : previewItems.length === 0 ? (
              <div className="text-center py-10 border rounded-xl text-zinc-500">
                Không có học sinh nào trong lớp học này.
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                    <TableRow>
                      <TableHead className="w-[40px] text-center">
                        <Checkbox
                          checked={selectedStudentIds.size === previewItems.length && previewItems.length > 0}
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>Học sinh</TableHead>
                      <TableHead className="text-center">Điểm danh (Có mặt / Trễ / Tổng)</TableHead>
                      <TableHead className="text-center w-[90px]">Số buổi tính</TableHead>
                      <TableHead className="text-right w-[110px]">Đơn giá</TableHead>
                      <TableHead className="text-right w-[95px]">Giảm trừ</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead className="w-[80px]">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map((item) => {
                      const isSelected = selectedStudentIds.has(item.studentId);
                      return (
                        <TableRow key={item.studentId} className={isSelected ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleStudent(item.studentId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.studentName}</div>
                            {item.phone && <div className="text-xs text-zinc-500">{item.phone}</div>}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-xs">
                              <span className="text-emerald-600 font-semibold">{item.presentCount} có mặt</span>
                              <span>•</span>
                              <span className="text-amber-600">{item.lateCount} trễ</span>
                              <span>•</span>
                              <span className="text-zinc-500">{item.totalSessionsInMonth} tổng</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              className="h-8 text-center text-xs font-semibold"
                              value={item.effectiveSessions}
                              onChange={(e) => handleItemChange(item.studentId, 'effectiveSessions', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="5000"
                              className="h-8 text-right text-xs"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.studentId, 'unitPrice', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="5000"
                              className="h-8 text-right text-xs text-red-600"
                              placeholder="0"
                              value={item.discount || ''}
                              onChange={(e) => handleItemChange(item.studentId, 'discount', Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                            {Number(item.totalAmount).toLocaleString('vi-VN')} đ
                          </TableCell>
                          <TableCell>
                            {item.hasExistingInvoice ? (
                              <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                                Đã có HĐ
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                Mới
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Thống kê nhanh thanh toán */}
          {selectedStudentIds.size > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Đang chọn <b>{selectedStudentIds.size}</b> học sinh
                </span>
              </div>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-2 sm:mt-0">
                Tổng phát hành: {totalSelectedAmount.toLocaleString('vi-VN')} đ
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Đóng
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || previewLoading || selectedStudentIds.size === 0}
            className="bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Receipt className="mr-2 h-4 w-4" />
            Sinh & Gửi Hóa Đơn ({selectedStudentIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
