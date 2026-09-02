import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, HardDrive, Link as LinkIcon, FolderPlus, FileVideo, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Liên kết Google Drive</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-fit">
              <Link href="/api/auth/google" className="flex items-center">
                <LinkIcon className="w-4 h-4 mr-2" />
                Kết nối Google Drive ngay
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md dark:bg-emerald-900/30 dark:text-emerald-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="text-zinc-500 mr-2">Đã kết nối:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{userEmail}</span>
              </div>
              <Link href="https://drive.google.com" target="_blank" className="ml-2 text-zinc-400 hover:text-blue-500">
                <LinkIcon className="w-4 h-4" />
              </Link>
            </div>
            
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tải tài liệu lên
            </Button>
          </div>

          <Tabs defaultValue="library" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="library">Kho tài liệu gốc</TabsTrigger>
              <TabsTrigger value="assignments">Tình trạng giao bài</TabsTrigger>
            </TabsList>
            
            <TabsContent value="library">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Tất cả tài liệu</CardTitle>
                      <CardDescription>Danh sách các bài giảng và bài tập bạn đã tải lên hệ thống.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                    <FolderPlus className="w-12 h-12 text-zinc-300 mb-3" />
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">Kho tài liệu đang trống</p>
                    <p className="text-sm">Bạn chưa tải lên bài giảng hay bài tập nào. Hãy tải lên file đầu tiên!</p>
                    <Button variant="outline" className="mt-4">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Tải lên ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Tiến độ nộp bài</CardTitle>
                      <CardDescription>Theo dõi tình trạng nộp bài tập của các lớp.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                    <FileVideo className="w-12 h-12 text-zinc-300 mb-3" />
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">Chưa giao bài tập nào</p>
                    <p className="text-sm">Sau khi tải tài liệu lên Kho, hãy chọn "Giao cho lớp" để bắt đầu theo dõi.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
