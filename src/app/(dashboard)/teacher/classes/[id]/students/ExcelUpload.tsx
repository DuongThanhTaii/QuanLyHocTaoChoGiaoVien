'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Download } from 'lucide-react';
import * as xlsx from 'xlsx';

export function ExcelUpload({ classId, onUploadSuccess }: { classId: string, onUploadSuccess?: () => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet) as any[];

      // Format data to match our schema (Họ và tên, SĐT, Email)
      const students = jsonData.map(row => ({
        fullName: row['Họ và tên'] || row['Họ tên'] || row['Name'] || '',
        phone: row['Số điện thoại'] || row['SĐT'] || row['Phone']?.toString() || '',
        email: row['Email'] || ''
      })).filter(s => s.fullName); // Require at least full name

      if (students.length === 0) {
        toast.error('Không tìm thấy dữ liệu học sinh hợp lệ. Vui lòng kiểm tra lại file Excel.');
        setIsUploading(false);
        return;
      }

      // Send to server action or API
      const response = await fetch('/api/teacher/classes/upload-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId, students })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Đã thêm ${students.length} học sinh thành công!`);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi thêm học sinh.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể đọc file Excel. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      { 'Họ và tên': 'Nguyễn Văn A', 'Số điện thoại': '0901234567', 'Email': 'nguyenvana@example.com' },
      { 'Họ và tên': 'Trần Thị B', 'Số điện thoại': '', 'Email': 'tranthib@example.com' }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
    xlsx.writeFile(wb, "BieuMau_ThemHocSinh.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500 mb-4">
        Nhập danh sách học sinh từ file Excel. Bạn có thể tải biểu mẫu bên dưới. (Nên kèm Số điện thoại hoặc Email để học sinh tự động nhận diện tài khoản)
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownloadTemplate} type="button" className="w-full text-xs" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Tải biểu mẫu
        </Button>
      </div>

      <div className="relative h-32 border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-lg flex flex-col items-center justify-center text-zinc-500 cursor-pointer">
        <input 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileUpload} 
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
        />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-500 mb-2"></div>
            <span className="text-sm">Đang xử lý...</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mb-2 text-zinc-400" />
            <span className="text-sm font-medium">Nhấn hoặc kéo thả file .xlsx vào đây</span>
          </>
        )}
      </div>
    </div>
  );
}
