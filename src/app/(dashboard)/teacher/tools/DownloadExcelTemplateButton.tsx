'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as xlsx from 'xlsx';

export function DownloadExcelTemplateButton() {
  const handleDownload = () => {
    const ws = xlsx.utils.json_to_sheet([
      { 'Họ và tên': 'Nguyễn Văn A', 'Số điện thoại': '0901234567', 'Email': 'nguyenvana@example.com' },
      { 'Họ và tên': 'Trần Thị B', 'Số điện thoại': '', 'Email': 'tranthib@example.com' }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "DanhSachHocSinh");
    xlsx.writeFile(wb, "BieuMau_ThemHocSinh.xlsx");
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleDownload}>
      <Download className="w-4 h-4 mr-2" />
      Tải xuống mẫu (.xlsx)
    </Button>
  );
}
