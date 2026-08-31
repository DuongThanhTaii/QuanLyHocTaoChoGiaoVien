'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Users, MessageSquare, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NewChatModal } from './NewChatModal';
import { CreateClassGroupModal } from './CreateClassGroupModal';

interface ConversationListProps {
  conversations: any[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (id: string) => void;
  currentUserRole?: string;
  isLoading?: boolean;
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return 'Hôm qua';
    }
    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  currentUserRole,
  isLoading = false
}: ConversationListProps) {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredConversations = (conversations || []).filter((conv) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    const titleMatch = conv.title?.toLowerCase().includes(query);
    const msgMatch = conv.lastMessageText?.toLowerCase().includes(query);
    return titleMatch || msgMatch;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200">
      {/* Header & Actions */}
      <div className="p-4 border-b border-zinc-200 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          {currentUserRole === 'teacher' && (
            <div className="flex-1">
              <CreateClassGroupModal onGroupCreated={onNewConversation} />
            </div>
          )}
          <div className="flex-1">
            <NewChatModal onConversationCreated={onNewConversation} />
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 h-9 text-xs bg-zinc-50 border-zinc-200 focus:bg-white"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
        {isLoading ? (
          <div className="divide-y divide-zinc-100 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3.5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-zinc-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 bg-zinc-200 rounded w-28" />
                    <div className="h-2.5 bg-zinc-100 rounded w-8" />
                  </div>
                  <div className="h-3 bg-zinc-100 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="relative mb-2 flex flex-col items-center">
              <Image
                src="/images/empty_states/empty.png"
                alt="Chưa có cuộc trò chuyện nào"
                width={140}
                height={140}
                className="w-28 h-28 object-contain relative z-10"
              />
              <div className="w-24 h-2 bg-zinc-400/40 rounded-[50%] blur-[2px] -mt-[22px] z-0" />
            </div>
            <p className="text-zinc-500 text-xs font-medium">
              {searchFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có cuộc trò chuyện nào'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isGroup = conv.type === 'group';
            const partner = conv.partnerInfo;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <div className="relative shrink-0">
                  {isGroup ? (
                    <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold ring-1 ring-purple-200 dark:ring-purple-800">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <UserAvatar name={partner?.fullName || conv.title} email={partner?.email} size="lg" className="w-11 h-11 text-sm" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4
                      className={`text-sm truncate ${
                        isActive 
                          ? 'font-bold text-blue-950' 
                          : conv.isUnread
                          ? 'font-bold text-zinc-950'
                          : 'font-medium text-zinc-800'
                      }`}
                    >
                      {conv.title}
                    </h4>
                    <span className={`text-[10px] shrink-0 ${conv.isUnread ? 'font-semibold text-primary' : 'text-zinc-400 font-normal'}`}>
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate ${
                        isActive 
                          ? 'text-blue-900/80 font-medium' 
                          : conv.isUnread
                          ? 'text-zinc-900 font-semibold'
                          : 'text-zinc-500 font-normal'
                      }`}
                    >
                      {conv.lastMessageText || 'Bắt đầu cuộc trò chuyện'}
                    </p>
                    {conv.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-2xs" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
