import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRCodeDisplay } from './QRCodeDisplay';
import { DeleteClassButton } from './DeleteClassButton';
import { getAppUrl } from '@/lib/app-url';
import { ClassSettingsForm } from './ClassSettingsForm';
import { GenerateInvitationButton } from './GenerateInvitationButton';
import { CopyableLink } from './CopyableLink';

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
  const { data: classroom } = await supabase.from('classes').select('id, name, subject, description, fee_per_session, fee_type, color').eq('id', id).single();

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: invitations } = await supabaseAdmin
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

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle>Mã tham gia lớp học</CardTitle>
          <CardDescription>Mã lớp và QR code để học sinh tham gia lớp của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {activeInvitation ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full flex flex-col justify-center">
                <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 rounded-lg border border-zinc-200 h-full">
                  <span className="text-sm text-zinc-500 mb-3 uppercase tracking-wider font-semibold">Mã Lớp</span>
                  <span className="text-5xl font-black tracking-widest text-zinc-900">{activeInvitation.join_code}</span>
                </div>
              </div>
              <div className="flex-1 w-full flex flex-col items-center justify-center p-6 border-t md:border-t-0 md:border-l border-zinc-100">
                <QRCodeDisplay value={joinUrl} />
                <CopyableLink url={joinUrl} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-zinc-50 rounded-lg border border-zinc-200 border-dashed space-y-4">
              <p className="text-zinc-500 text-sm max-w-sm">Chưa có mã tham gia nào được tạo cho lớp học này. Vui lòng tạo mã để học sinh có thể tham gia lớp.</p>
              <GenerateInvitationButton classId={id} />
            </div>
          )}
        </CardContent>
      </Card>
      {classroom && <Card className="border-zinc-200 shadow-sm"><CardHeader><CardTitle>Thông tin lớp học</CardTitle><CardDescription>Điều chỉnh thông tin cơ bản và học phí của lớp.</CardDescription></CardHeader><CardContent><ClassSettingsForm classroom={classroom} /></CardContent></Card>}
      
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
