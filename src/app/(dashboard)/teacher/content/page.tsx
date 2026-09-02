import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, HardDrive, Link as LinkIcon, FolderPlus, FileVideo, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function TeacherContentPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const successMessage = params.success === 'drive_linked' ? 'Kết nối Google Drive thành công!' : null;
  const errorMessage = params.error ? 'Kết nối thất bại. Vui lòng thử lại.' : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isDriveLinked = false;
  let userEmail = user?.email || '';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();
      
    if (profile?.google_refresh_token) {
      isDriveLinked = true;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Bài giảng & Bài tập</h1>
        <p className="text-zinc-500">Quản lý toàn bộ học liệu, bài tập và chấm điểm học sinh.</p>
      </div>

      {successMessage && (
        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">Liên kết Google Drive</CardTitle>
            </div>
            <CardDescription className="text-base">
              Hệ thống sử dụng trực tiếp Google Drive của bạn để lưu trữ bài giảng và bài làm của học sinh (không giới hạn dung lượng).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Học sinh nộp bài, file đi thẳng vào thư mục Drive của bạn.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Upload video bài giảng nặng hàng GB thoải mái.
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Bạn toàn quyền kiểm soát và sở hữu dữ liệu.
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 py-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium" asChild>
              <Link href="/api/auth/google">
                <LinkIcon className="w-4 h-4 mr-2" />
                Kết nối Google Drive ngay
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Thư viện Học liệu</CardTitle>
                <CardDescription>Các tài liệu và video đã tải lên Drive.</CardDescription>
              </div>
              <Button size="sm">
                <PlusCircle className="w-4 h-4 mr-2" /> Tải lên
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <FileVideo className="w-10 h-10 text-zinc-300 mb-3" />
                <p className="text-zinc-500 font-medium">Chưa có tài liệu nào</p>
                <p className="text-zinc-400 text-sm">Bấm "Tải lên" để thêm file từ máy tính</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Trạng thái lưu trữ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Đã kết nối Drive</p>
                    <p className="text-xs text-zinc-500">{userEmail}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link href="https://drive.google.com" target="_blank">
                    <FolderPlus className="w-3.5 h-3.5 mr-2" /> Mở thư mục Drive
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
