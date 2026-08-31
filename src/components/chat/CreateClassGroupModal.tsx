'use client';

import React, { useState, useEffect } from 'react';
import { Users, Info, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getTeacherClassesForChat, createClassGroupConversation } from '@/app/actions/chat-actions';
import { toast } from 'sonner';

interface CreateClassGroupModalProps {
  onGroupCreated: (conversationId: string) => void;
}

export function CreateClassGroupModal({ onGroupCreated }: CreateClassGroupModalProps) {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getTeacherClassesForChat()
        .then((res) => {
          setClasses(res.classes || []);
          if (res.classes && res.classes.length > 0) {
            setSelectedClassId(res.classes[0].id);
            setCustomTitle(`Lớp ${res.classes[0].name}`);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [open]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const selected = classes.find((c) => c.id === classId);
    if (selected) {
      setCustomTitle(`Lớp ${selected.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setIsSubmitting(true);
    const res = await createClassGroupConversation(selectedClassId, customTitle);
    setIsSubmitting(false);

    if (res?.error) {
      toast.error(res.error);
    } else if (res?.conversationId) {
      setOpen(false);
      onGroupCreated(res.conversationId);
      toast.success(`Đã tạo nhóm chat (${res.memberCount} thành viên)!`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="w-full h-9 px-3 gap-1.5 justify-center" />}>
        <Users className="w-4 h-4 text-zinc-900" />
        <span>Tạo nhóm lớp</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Tạo nhóm chat lớp học</DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex items-center text-zinc-400 hover:text-zinc-700 cursor-help" />}>
                  <Info className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                  Học sinh đã có tài khoản sẽ tự động nhìn thấy nhóm chat này trong mục Tin nhắn của họ.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <DialogDescription>
            Hệ thống sẽ tự động thêm tất cả các học sinh đang học trong lớp vào nhóm chat này.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          </div>
        ) : classes.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-sm">
            Bạn chưa có lớp học nào đang hoạt động.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Chọn lớp học</Label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.subject ? `(${c.subject})` : ''} - {c.studentCount} học sinh
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tên nhóm chat</Label>
              <Input
                type="text"
                placeholder="VD: Lớp Toán 12A - Luyện thi"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedClassId}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tạo nhóm
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
