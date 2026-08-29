'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeDisplay } from '../settings/QRCodeDisplay';
import { EnrollStudentForm } from './StudentForms';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { ExcelUpload } from './ExcelUpload';

export function AddStudentTabs({ classId, invitationCode, joinUrl }: { classId: string, invitationCode?: string, joinUrl?: string }) {

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold leading-none tracking-tight">Thêm Học Sinh Mới</h2>
        <p className="text-sm text-muted-foreground">Chọn một trong các phương thức sau để thêm học sinh vào lớp.</p>
      </div>
      <div>
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
                <br />
                <span className="text-amber-600 font-medium text-xs">Mẹo: Hãy điền Số điện thoại hoặc Email để học sinh có thể tự động liên kết tài khoản khi tham gia bằng mã.</span>
              </div>
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
               {joinUrl && (
                 <>
                   <p className="break-all text-center text-xs text-zinc-500">{joinUrl}</p>
                   <Button 
                     variant="outline" 
                     className="w-full mt-4"
                     onClick={() => {
                       if (navigator.share) {
                         navigator.share({
                           title: 'Tham gia lớp học',
                           text: `Tham gia lớp học với mã: ${invitationCode}`,
                           url: joinUrl,
                         }).catch(console.error);
                       } else {
                         navigator.clipboard.writeText(joinUrl);
                         toast.success('Đã sao chép link tham gia!');
                       }
                     }}
                   >
                     Chia sẻ liên kết
                   </Button>
                 </>
               )}
             </div>
          </TabsContent>
          
          <TabsContent value="qr" className="mt-4">
             <div className="space-y-4 flex flex-col items-center">
               <div className="text-sm text-zinc-500 text-center mb-2">
                 Đưa mã QR này cho học sinh quét để tham gia lớp:
               </div>
               {joinUrl ? (
                 <>
                   <QRCodeDisplay value={joinUrl} />
                   <Button 
                     variant="outline" 
                     className="w-full mt-4"
                     onClick={() => {
                       if (navigator.share) {
                         navigator.share({
                           title: 'Tham gia lớp học',
                           text: 'Quét mã QR hoặc truy cập đường link để tham gia lớp học.',
                           url: joinUrl,
                         }).catch(console.error);
                       } else {
                         navigator.clipboard.writeText(joinUrl);
                         toast.success('Đã sao chép link tham gia!');
                       }
                     }}
                   >
                     Chia sẻ liên kết
                   </Button>
                 </>
               ) : (
                 <p className="text-sm text-zinc-500">Chưa có mã lớp</p>
               )}
             </div>
          </TabsContent>

          <TabsContent value="excel" className="mt-4">
             <ExcelUpload classId={classId} onUploadSuccess={() => { window.location.reload(); }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
