import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeDisplay } from './QRCodeDisplay';
import { DeleteClassButton } from './DeleteClassButton';
import { getAppUrl } from '@/lib/app-url';

export default async function ClassSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { data: invitations } = await supabase
    .from('class_invitations')
    .select('*')
    .eq('class_id', id)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  const activeInvitation = invitations?.[0];
  
  // The absolute URL for joining. In a real app, you'd get this from env
  const joinUrl = activeInvitation ? `${appUrl}/join/${activeInvitation.join_code}` : '';

  return (
    <div className="space-y-6">
      {sp?.success === 'true' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>Tạo lớp học thành công! Mời học sinh tham gia bằng Mã lớp hoặc QR Code bên dưới.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Mã tham gia lớp học</CardTitle>
            <CardDescription>Cung cấp mã này cho học sinh để tham gia lớp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeInvitation ? (
              <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="text-sm text-zinc-500 mb-2">Mã Lớp</span>
                <span className="text-4xl font-black tracking-widest text-zinc-900">{activeInvitation.join_code}</span>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">Chưa có mã tham gia nào được tạo.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle>Mã QR tham gia</CardTitle>
            <CardDescription>Học sinh quét mã QR để vào thẳng màn hình tham gia</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
             {joinUrl ? (
                <div className="space-y-3 text-center"><QRCodeDisplay value={joinUrl} /><p className="break-all text-xs text-zinc-500">{joinUrl}</p></div>
             ) : (
               <p className="text-zinc-500 text-sm">Chưa có mã QR</p>
             )}
          </CardContent>
        </Card>
      </div>
      
      {/* Cấu hình khác của lớp sẽ được đặt ở đây */}
      <Card className="border-red-100 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-red-600">Vùng nguy hiểm (Danger Zone)</CardTitle>
          <CardDescription>Các thao tác không thể hoàn tác đối với lớp học này.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteClassButton classId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
