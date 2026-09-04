import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
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
  let materials: any[] = [];
  let classes: any[] = [];
  let lessons: any[] = [];
  let exercises: any[] = [];

  if (user) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check Google Drive connection
    const { data: profile } = await admin
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    if (profile?.google_refresh_token) {
      isDriveLinked = true;
    }

    // 2. Fetch teacher's classes
    const { data: classesData } = await admin
      .from('classes')
      .select('id, name, subject, color')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    classes = classesData || [];
    const classIds = classes.map((c) => c.id);

    if (classIds.length > 0) {
      // 3. Fetch materials for teacher's classes
      const { data: materialsData } = await admin
        .from('materials')
        .select('*')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      // De-duplicate materials by name or storage_path if assigned to multiple classes
      const seen = new Set<string>();
      materials = (materialsData || []).filter((m) => {
        const key = m.storage_path || m.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // 4. Fetch lessons for teacher's classes
      const { data: lessonsData } = await admin
        .from('lessons')
        .select('id, class_id, title, content, created_at, materials(*)')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      lessons = lessonsData || [];

      // 5. Fetch exercises for teacher's classes
      const { data: exercisesData } = await admin
        .from('exercises')
        .select('id, class_id, title, description, due_date, max_score, attachments, created_at')
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      exercises = exercisesData || [];
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
                    Đăng nhập Google Drive để có thể tải và quản lý học liệu trên Mari.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href="/api/auth/google"
                className={buttonVariants({
                  className: 'w-fit bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-2',
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
          isDriveLinked={isDriveLinked}
          classes={classes}
          initialMaterials={materials}
          lessons={lessons}
          exercises={exercises}
        />
      )}
    </div>
  );
}
