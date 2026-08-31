'use client';

import React, { useState } from 'react';
import { Users, Crown, Shield, User, Edit2, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { updateGroupTitle } from '@/app/actions/chat-actions';
import { toast } from 'sonner';

interface GroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: any;
  currentUserId: string;
  onTitleUpdated: (newTitle: string) => void;
}

const roleLabels: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
  admin: 'Quản trị'
};

const roleColors: Record<string, string> = {
  teacher: 'bg-blue-50 text-blue-700 border-blue-200',
  student: 'bg-green-50 text-green-700 border-green-200',
  parent: 'bg-purple-50 text-purple-700 border-purple-200'
};

export function GroupMembersModal({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onTitleUpdated
}: GroupMembersModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation?.title || '');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const participants = conversation?.participants || [];
  const isAdmin = conversation?.myRole === 'admin' || conversation?.createdBy === currentUserId;

  const handleSaveTitle = async () => {
    if (!newTitle.trim() || newTitle === conversation.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    const res = await updateGroupTitle(conversation.id, newTitle.trim());
    setIsSavingTitle(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      setIsEditingTitle(false);
      onTitleUpdated(newTitle.trim());
      toast.success('Đã đổi tên nhóm chat!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <DialogTitle>Thông tin nhóm chat</DialogTitle>
          </div>
          <DialogDescription>
            Danh sách các thành viên và thông tin của nhóm chat này.
          </DialogDescription>
        </DialogHeader>

        {/* Tên nhóm & Đổi tên */}
        <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 space-y-2 mt-2">
          <div className="text-xs text-zinc-500 font-medium">Tên nhóm</div>
          {isEditingTitle ? (
            <div className="flex gap-2">
              <Input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-sm bg-white"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveTitle} disabled={isSavingTitle} className="h-8 px-3">
                {isSavingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-zinc-900">{conversation?.title}</span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(conversation?.title || '');
                    setIsEditingTitle(true);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Đổi tên
                </button>
              )}
            </div>
          )}
        </div>

        {/* Danh sách thành viên */}
        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 px-1">
            <span>Thành viên ({participants.length})</span>
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            {participants.map((member: any) => {
              const isGroupAdmin = member.role === 'admin' || member.userId === conversation?.createdBy;
              const isMe = member.userId === currentUserId;

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar name={member.fullName} email={member.email} size="sm" className="w-8 h-8 text-xs shrink-0" />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold text-xs text-zinc-900 truncate">
                          {member.fullName} {isMe ? '(Bạn)' : ''}
                        </span>
                        {isGroupAdmin && (
                          <span title="Trưởng nhóm" className="flex items-center text-amber-500">
                            <Crown className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-300 text-xs hidden sm:inline">•</span>
                      <div className="text-xs text-zinc-500 truncate min-w-0 font-normal">
                        {member.email || member.phone || ''}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                        roleColors[member.userRole] || 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}
                    >
                      {roleLabels[member.userRole] || member.userRole}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
