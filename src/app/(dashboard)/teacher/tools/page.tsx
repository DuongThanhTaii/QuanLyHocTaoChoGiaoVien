import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Link as LinkIcon } from 'lucide-react';
import { DownloadExcelTemplateButton } from './DownloadExcelTemplateButton';

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tiện ích & Biểu mẫu</h1>
        <p className="text-zinc-500">Các công cụ và biểu mẫu giúp bạn quản lý lớp học dễ dàng hơn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <CardTitle>Mẫu Import Học Sinh</CardTitle>
            <CardDescription>File Excel mẫu để nhập danh sách học sinh hàng loạt vào lớp học.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* The Excel format logic could be a client component or just a direct link to a static file. We can reuse the logic from ExcelUpload but as a client component download button, or just create a simple Client component here. */}
            <DownloadExcelTemplateButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
