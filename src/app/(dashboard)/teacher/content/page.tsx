import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GoogleDriveIcon } from '@/components/icons/GoogleDriveIcon';
import { ContentManagerClient } from './components/ContentManagerClient';

export default async function TeacherContentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const successMessage = params.success === 'drive_linked' ? 'Kết nối Google Drive thành công!' : null;
  const errorMessage = params.error ? 'Kết nối thất bại hoặc token đã hết hạn. Vui lòng thử lại.' : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isDriveLinked = false;
  let userEmail = user?.email || '';
  let materials: any[] = [];

  if (user) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    if (profile?.google_refresh_token) {
      isDriveLinked = true;

      // Fetch teacher's materials from database
      const { data: materialsData, error: matError } = await admin
        .from('materials')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (!matError && materialsData) {
        materials = materialsData;
      }
    }
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!isDriveLinked ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bài giảng & Bài tập
            </h1>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm max-w-xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
                  <GoogleDriveIcon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Liên kết Google Drive</CardTitle>
                  <CardDescription>
                    Kết nối tài khoản Google Drive để lưu trữ và quản lý bài giảng, bài tập không giới hạn.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href="/api/auth/google"
                className={buttonVariants({
                  className: "w-fit bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2",
                })}
              >
                <GoogleDriveIcon className="w-4 h-4" />
                Kết nối Google Drive ngay
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <ContentManagerClient
          userEmail={userEmail}
          isDriveLinked={isDriveLinked}
          initialMaterials={materials}
        />
      )}
    </div>
  );
}
