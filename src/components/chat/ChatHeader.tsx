'use client';

import React, { useState } from 'react';
import { Users, MoreVertical, LogOut, Trash2, Info, ChevronLeft, UserCheck, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GroupMembersModal } from './GroupMembersModal';
import { leaveConversation } from '@/app/actions/chat-actions';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: any;
  currentUserId: string;
  onBack?: () => void;
  onLeaveOrDelete?: () => void;
  onTitleUpdated?: (newTitle: string) => void;
}

const roleLabels: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
  admin: 'Quản trị viên'
};

export function ChatHeader({
  conversation,
  currentUserId,
  onBack,
  onLeaveOrDelete,
  onTitleUpdated
}: ChatHeaderProps) {
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const partner = conversation.partnerInfo;

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn có chắc chắn muốn rời khỏi nhóm chat này không?')) return;

    setIsLeaving(true);
    const res = await leaveConversation(conversation.id);
    setIsLeaving(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Đã rời khỏi nhóm chat.');
      if (onLeaveOrDelete) onLeaveOrDelete();
    }
  };

  const handleDeleteDirect = async () => {
    if (!confirm('Bạn có chắc muốn xóa đoạn chat này khỏi danh sách không?')) return;

    setIsLeaving(true);
    const res = await leaveConversation(conversation.id);
    setIsLeaving(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Đã xóa đoạn chat.');
      if (onLeaveOrDelete) onLeaveOrDelete();
    }
  };

  return (
    <>
      <div className="h-16 px-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden h-8 w-8 text-zinc-500 hover:text-zinc-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {isGroup ? (
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold ring-1 ring-purple-200 dark:ring-purple-800 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          ) : (
            <UserAvatar name={partner?.fullName || conversation.title} email={partner?.email} size="lg" className="shrink-0" />
          )}

          <div>
            <h3 className="font-semibold text-sm text-zinc-900 leading-tight line-clamp-1">
              {conversation.title}
            </h3>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5">
              {isGroup ? (
                <span>Nhóm lớp • {conversation.memberCount} thành viên</span>
              ) : partner ? (
                <span>
                  {roleLabels[partner.userRole] || partner.userRole}
                  {partner.phone ? ` • ${partner.phone}` : partner.email ? ` • ${partner.email}` : ''}
                </span>
              ) : (
                'Trực tiếp'
              )}
            </p>
          </div>
        </div>

        {/* Action Menu */}
        <div className="flex items-center gap-1">
          {isGroup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMembersModalOpen(true)}
              className="hidden sm:flex text-xs text-zinc-600 gap-1.5 h-8"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Thành viên</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              {isGroup ? (
                <>
                  <DropdownMenuItem onClick={() => setMembersModalOpen(true)}>
                    <Info className="w-4 h-4 mr-2 text-zinc-500" />
                    <span>Thông tin & Thành viên</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLeaveGroup} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Rời khỏi nhóm</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={handleDeleteDirect} className="text-red-600 focus:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>Xóa đoạn chat</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isGroup && (
        <GroupMembersModal
          open={membersModalOpen}
          onOpenChange={setMembersModalOpen}
          conversation={conversation}
          currentUserId={currentUserId}
          onTitleUpdated={(newTitle) => {
            if (onTitleUpdated) onTitleUpdated(newTitle);
          }}
        />
      )}
    </>
  );
}
