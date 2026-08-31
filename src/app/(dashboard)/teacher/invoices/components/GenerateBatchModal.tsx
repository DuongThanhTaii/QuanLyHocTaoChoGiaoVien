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
import { Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-bold">
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
              <Label className="text-xs font-semibold">Lớp học</Label>
              <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v || '')} disabled={loadingClasses || previewLoading}>
                <SelectTrigger className="w-full text-xs h-9">
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
              <Label className="text-xs font-semibold">Tháng</Label>
              <Select value={String(month)} onValueChange={(v) => v && setMonth(Number(v))} disabled={previewLoading}>
                <SelectTrigger className="w-full text-xs h-9">
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
              <Label className="text-xs font-semibold">Năm</Label>
              <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))} disabled={previewLoading}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {[year - 1, year, year + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bảng Preview Tính Toán Tự Động Từ Điểm Danh */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAll"
                  checked={previewItems.length > 0 && selectedStudentIds.size === previewItems.length}
                  onCheckedChange={handleToggleAll}
                />
                <label htmlFor="selectAll" className="text-xs font-semibold cursor-pointer">
                  Chọn tất cả ({selectedStudentIds.size}/{previewItems.length} học sinh)
                </label>
              </div>

              {selectedClass && (
                <div className="text-xs text-zinc-500">
                  Học phí gốc: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Number(selectedClass.fee_per_session).toLocaleString('vi-VN')} đ/buổi</span>
                </div>
              )}
            </div>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-zinc-500">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-xs">Đang quét điểm danh và tính toán học phí...</span>
              </div>
            ) : previewItems.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl text-zinc-400 text-xs">
                Không tìm thấy học sinh nào trong lớp này.
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                <Table>
                  <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                    <TableRow>
                      <TableHead className="w-10 text-center"></TableHead>
                      <TableHead className="text-xs font-semibold">Học sinh</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Điểm danh (Có mặt / Phép / Vắng)</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Số buổi tính phí</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Đơn giá</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Miễn giảm</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Tổng học phí</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewItems.map((item) => {
                      const isSelected = selectedStudentIds.has(item.studentId);
                      const hasInvoice = item.hasExistingInvoice;

                      return (
                        <TableRow key={item.studentId} className={`text-xs ${hasInvoice ? 'opacity-60 bg-zinc-50/40 dark:bg-zinc-900/40' : ''}`}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={isSelected}
                              disabled={hasInvoice}
                              onCheckedChange={() => handleToggleStudent(item.studentId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.fullName}</div>
                            {item.phone && <div className="text-[10px] text-zinc-400">{item.phone}</div>}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] px-1.5 py-0">
                                {item.presentCount} Có mặt
                              </Badge>
                              {item.excusedCount > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px] px-1.5 py-0">
                                  {item.excusedCount} Phép
                                </Badge>
                              )}
                              {item.absentCount > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 text-[10px] px-1.5 py-0">
                                  {item.absentCount} Vắng
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              value={item.effectiveSessions}
                              disabled={hasInvoice || !isSelected}
                              onChange={(e) => handleItemChange(item.studentId, 'effectiveSessions', Number(e.target.value))}
                              className="w-16 text-center text-xs h-7 mx-auto font-mono"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="10000"
                              value={item.unitPrice}
                              disabled={hasInvoice || !isSelected}
                              onChange={(e) => handleItemChange(item.studentId, 'unitPrice', Number(e.target.value))}
                              className="w-24 text-right text-xs h-7 ml-auto font-mono"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="10000"
                              value={item.discount || ''}
                              placeholder="0"
                              disabled={hasInvoice || !isSelected}
                              onChange={(e) => handleItemChange(item.studentId, 'discount', Number(e.target.value))}
                              className="w-20 text-right text-xs h-7 ml-auto font-mono"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                            {Number(item.totalAmount || 0).toLocaleString('vi-VN')} đ
                          </TableCell>
                          <TableCell className="text-center">
                            {hasInvoice ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Đã có HĐ
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px]">
                                Sẵn sàng tạo
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

          {/* Tổng tiền dự kiến */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-3">
            <div className="text-xs text-zinc-500">
              Đã chọn <b className="text-zinc-900 dark:text-zinc-100">{selectedStudentIds.size}</b> học sinh để xuất hóa đơn tháng {month}/{year}.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tổng doanh thu dự kiến:</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {totalSelectedAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={generating} className="text-xs h-9">
            Hủy
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || previewLoading || selectedStudentIds.size === 0}
            className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-9"
          >
            {generating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Sinh {selectedStudentIds.size} Hóa đơn & Gửi phụ huynh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
