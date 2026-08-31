'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteClass } from '../../actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

export function DeleteClassButton({ classId }: { classId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClass(classId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2 cursor-pointer shadow-xs gap-2">
        <Trash2 className="w-4 h-4 text-white" />
        <span className="text-white font-medium">Xóa lớp học (Hard Delete)</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa vĩnh viễn?</AlertDialogTitle>
          <AlertDialogDescription>
            Thao tác này sẽ xóa hoàn toàn lớp học, tất cả lịch học, học sinh (Ghi danh), điểm danh và dữ liệu liên quan khỏi hệ thống.
            <br /><br />
            Lưu ý: Không thể hoàn tác sau khi xóa!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {isPending ? 'Đang xóa...' : 'Đồng ý xóa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
