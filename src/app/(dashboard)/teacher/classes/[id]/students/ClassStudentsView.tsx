'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Plus, CheckCircle2, HelpCircle, Pencil, Users, TrendingUp } from 'lucide-react';
import { AddStudentTabs } from './AddStudentTabs';
import { CopyPersonalLinkButton } from './CopyPersonalLinkButton';
import { EditStudentForm } from './StudentForms';
import { ApproveEnrollmentButton } from './ApproveEnrollmentButton';
import { ParentContactPopover } from './ParentContactPopover';
import { StudentProgressLedger, StudentLedgerItem } from '../components/StudentProgressLedger';

const enrollmentStatusLabels: Record<string, string> = { 
  ACTIVE: 'Đang học', 
  PENDING: 'Chờ duyệt', 
  PAUSED: 'Tạm dừng', 
  LEFT: 'Đã rời lớp', 
  BLOCKED: 'Đã khóa' 
};

const enrollmentStatusColors: Record<string, string> = { 
  ACTIVE: 'bg-green-50 text-green-700 ring-green-600/20', 
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20', 
  PAUSED: 'bg-blue-50 text-blue-700 ring-blue-600/20', 
  LEFT: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20', 
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20' 
};

interface Props {
  classId: string;
  students: any[];
  activeInvitation: any;
  appUrl: string;
  ledgerStudents: StudentLedgerItem[];
}

export function ClassStudentsView({
  classId,
  students,
  activeInvitation,
  appUrl,
  ledgerStudents
}: Props) {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'progress' ? 'progress' : 'roster';
  const [activeView, setActiveView] = useState<'roster' | 'progress'>(initialView);

  return (
    <div className="space-y-6">
      {/* Sub-navigation Pills để chuyển đổi nhanh giữa Danh sách lớp và Tiến độ 360° */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveView('roster')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'roster'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-zinc-500 hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Danh sách lớp (Hồ sơ)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 ml-1">
              {students.length}
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveView('progress')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeView === 'progress'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-zinc-500 hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span>Tiến độ & Tổng hợp 360°</span>
          </button>
        </div>

        {activeView === 'roster' && (
          <Sheet>
            <SheetTrigger render={<Button size="sm" className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-2xs" />}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Thêm học sinh
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
              <div className="p-6 pt-12">
                <AddStudentTabs
                  classId={classId}
                  invitationCode={activeInvitation?.join_code}
                  joinUrl={activeInvitation ? `${appUrl}/join/${activeInvitation.join_code}` : undefined}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Chế độ 1: Danh sách học sinh & Hồ sơ */}
      {activeView === 'roster' && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Danh sách học sinh trong lớp
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Quản lý hồ sơ, tài khoản và thông tin liên lạc phụ huynh của {students.length} học sinh.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-900/75">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Họ tên</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="text-xs font-semibold">SĐT</TableHead>
                    <TableHead className="text-xs font-semibold">Trạng thái</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-zinc-400 text-xs py-8">
                        Chưa có học sinh nào trong lớp. Bấm "Thêm học sinh" để bắt đầu.
                      </TableCell>
                    </TableRow>
                  )}
                  {students.map(({ enrollment, studentProfile, guardians }) => (
                    <TableRow key={enrollment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {studentProfile?.full_name || 'Không rõ'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">{studentProfile?.email || '--'}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{studentProfile?.phone || '--'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${enrollmentStatusColors[enrollment.status] || 'bg-zinc-100 text-zinc-700 ring-zinc-500/20'}`}>
                          {enrollmentStatusLabels[enrollment.status] || enrollment.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {studentProfile?.user_id ? (
                            <span title="Đã tham gia (Đã liên kết tài khoản)" className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span title="Chưa tham gia" className="inline-flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          
                          {studentProfile && !studentProfile.user_id && activeInvitation && (
                            <div title="Sao chép link tham gia">
                              <CopyPersonalLinkButton url={`${appUrl}/join/${activeInvitation.join_code}?claim=${studentProfile.id}`} />
                            </div>
                          )}
                          {enrollment.status === 'PENDING' && <ApproveEnrollmentButton enrollmentId={enrollment.id} classId={classId} />}
                          
                          {/* Nút xem thông tin phụ huynh khi hover */}
                          <ParentContactPopover
                            studentName={studentProfile?.full_name || 'Học sinh'}
                            guardians={guardians || []}
                          />

                          {studentProfile && (
                            <Sheet>
                              <SheetTrigger render={<Button variant="outline" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-900" title="Chỉnh sửa thông tin" />}>
                                <Pencil className="h-3.5 w-3.5" />
                              </SheetTrigger>
                              <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
                                <div className="p-6 pt-12">
                                  <h2 className="text-lg font-semibold mb-6">Chỉnh sửa thông tin học sinh</h2>
                                  <EditStudentForm classId={classId} student={studentProfile} enrollment={enrollment} />
                                </div>
                              </SheetContent>
                            </Sheet>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chế độ 2: Tiến độ & Tổng hợp 360° */}
      {activeView === 'progress' && (
        <StudentProgressLedger classId={classId} students={ledgerStudents} />
      )}
    </div>
  );
}
