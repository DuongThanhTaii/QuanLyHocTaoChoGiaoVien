'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeDisplay } from '../settings/QRCodeDisplay';
import { EnrollStudentForm } from './StudentForms';

export function AddStudentTabs({ classId, invitationCode }: { classId: string, invitationCode?: string }) {
  const joinUrl = invitationCode ? `https://giasupro.taidt.id.vn/join/${invitationCode}` : '';

  return (
    <Card className="border-zinc-200 shadow-sm sticky top-6">
      <CardHeader>
        <CardTitle>Thêm Học Sinh Mới</CardTitle>
        <CardDescription>Chọn một trong các phương thức sau để thêm học sinh vào lớp.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-100">
            <TabsTrigger value="manual" className="text-xs">Thủ công</TabsTrigger>
            <TabsTrigger value="code" className="text-xs">Mã lớp</TabsTrigger>
            <TabsTrigger value="qr" className="text-xs">QR Code</TabsTrigger>
            <TabsTrigger value="excel" className="text-xs">Excel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-zinc-500 mb-4">
                Thêm trực tiếp hồ sơ học sinh. Học sinh không cần phải có tài khoản.
              </div>
              {/* Reuse the modified EnrollStudentForm or create a new AddStudentManualForm here */}
              <EnrollStudentForm classId={classId} />
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="mt-4">
             <div className="space-y-4">
               <div className="text-sm text-zinc-500 text-center mb-2">
                 Hướng dẫn học sinh truy cập trang chủ và nhập mã sau:
               </div>
               {invitationCode ? (
                 <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 text-center">
                   <span className="text-4xl tracking-[0.25em] font-black text-zinc-900">{invitationCode}</span>
                 </div>
               ) : (
                 <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 text-center">
                   <span className="text-2xl tracking-[0.5em] font-black">---</span>
                   <p className="text-xs text-zinc-400 mt-2">Chưa tạo mã lớp</p>
                 </div>
               )}
             </div>
          </TabsContent>
          
          <TabsContent value="qr" className="mt-4">
             <div className="space-y-4 flex flex-col items-center">
               <div className="text-sm text-zinc-500 text-center mb-2">
                 Đưa mã QR này cho học sinh quét để tham gia lớp:
               </div>
               {joinUrl ? (
                 <QRCodeDisplay value={joinUrl} />
               ) : (
                 <p className="text-sm text-zinc-500">Chưa có mã lớp</p>
               )}
             </div>
          </TabsContent>

          <TabsContent value="excel" className="mt-4">
             <div className="space-y-4">
               <div className="text-sm text-zinc-500 mb-4">
                 Tính năng nhập học sinh hàng loạt từ file Excel đang được phát triển.
               </div>
               <div className="h-32 border-2 border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400">
                 Kéo thả file .xlsx vào đây
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
