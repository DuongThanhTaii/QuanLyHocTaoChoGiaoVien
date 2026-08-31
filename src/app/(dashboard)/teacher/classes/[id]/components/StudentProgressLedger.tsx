'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, MessageSquare, ExternalLink, Users, CheckCircle, Clock, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';

export interface StudentLedgerItem {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  attendance: {
    attendedCount: number;
    totalSessions: number;
    absentCount: number;
    percentage: number;
  };
  tuition: {
    status: 'paid' | 'sent' | 'overdue' | 'not_created';
    amount: number;
    invoiceNumber: string | null;
  };
  evaluation: {
    rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | null;
    feedback: string | null;
  };
}

interface Props {
  classId: string;
  students: StudentLedgerItem[];
}

export function StudentProgressLedger({ classId, students }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm))
  );

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Bảng Tổng Hợp Theo Dõi Học Viên 360°</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {students.length} học sinh
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Theo dõi toàn diện số buổi đi học, tình trạng đóng học phí và đánh giá học lực của từng học sinh.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Tìm theo tên, SĐT học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-8 bg-background"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs border-t border-zinc-100 dark:border-zinc-800">
            {students.length === 0 ? 'Lớp chưa có học sinh nào. Hãy vào mục "Học sinh" để thêm học sinh mới.' : 'Không tìm thấy học sinh phù hợp.'}
          </div>
        ) : (
          <div className="border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Học sinh</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Chuyên cần</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Học phí kỳ này</TableHead>
                  <TableHead className="text-xs font-semibold">Đánh giá & Học lực</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Lối tắt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => {
                  return (
                    <TableRow key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      {/* Cột 1: Thông tin học sinh */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {s.fullName.slice(-1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{s.fullName}</div>
                            <div className="text-[11px] text-zinc-400">{s.phone || 'Chưa có SĐT'}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Cột 2: Chuyên cần */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                            {s.attendance.attendedCount}/{s.attendance.totalSessions} buổi
                          </span>
                          <span className={`text-[10px] font-medium ${
                            s.attendance.percentage >= 80 ? 'text-emerald-600' :
                            s.attendance.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {s.attendance.totalSessions > 0 ? `${s.attendance.percentage}% có mặt` : 'Chưa có buổi'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Cột 3: Học phí */}
                      <TableCell className="text-center">
                        {s.tuition.status === 'paid' && (
                          <div className="inline-flex flex-col items-center">
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] gap-1">
                              <CheckCircle className="w-3 h-3" /> Đã thu
                            </Badge>
                            <span className="text-[11px] font-mono font-medium text-zinc-500 mt-0.5">
                              {s.tuition.amount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}
                        {s.tuition.status === 'sent' && (
                          <div className="inline-flex flex-col items-center">
                            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50/50 text-[10px] gap-1">
                              <Clock className="w-3 h-3" /> Chờ đóng
                            </Badge>
                            <span className="text-[11px] font-mono font-medium text-zinc-500 mt-0.5">
                              {s.tuition.amount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}
                        {s.tuition.status === 'overdue' && (
                          <div className="inline-flex flex-col items-center">
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="w-3 h-3" /> Quá hạn
                            </Badge>
                            <span className="text-[11px] font-mono font-medium text-red-600 mt-0.5">
                              {s.tuition.amount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        )}
                        {s.tuition.status === 'not_created' && (
                          <Badge variant="secondary" className="text-[10px] text-zinc-400">
                            Chưa tạo HĐ
                          </Badge>
                        )}
                      </TableCell>

                      {/* Cột 4: Đánh giá & Học lực */}
                      <TableCell>
                        {s.evaluation.rating ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={`text-[10px] ${
                                s.evaluation.rating === 'EXCELLENT' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                s.evaluation.rating === 'GOOD' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                s.evaluation.rating === 'AVERAGE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {s.evaluation.rating === 'EXCELLENT' ? '⭐ Xuất sắc' :
                                 s.evaluation.rating === 'GOOD' ? '👍 Tốt' :
                                 s.evaluation.rating === 'AVERAGE' ? 'Ổn định' : 'Cần cố gắng'}
                              </Badge>
                            </div>
                            {s.evaluation.feedback && (
                              <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">
                                {s.evaluation.feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Chưa có đánh giá</span>
                        )}
                      </TableCell>

                      {/* Cột 5: Lối tắt hành động */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/teacher/classes/${classId}/attendance`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Điểm danh học sinh này"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/teacher/classes/${classId}/evaluations`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Viết nhận xét / đánh giá"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/teacher/invoices`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            title="Xem hóa đơn học phí"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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
  );
}
