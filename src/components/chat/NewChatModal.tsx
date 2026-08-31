'use client';

import React, { useState } from 'react';
import { Search, MessageSquare, User, Phone, Mail, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchUserByPhoneOrEmail, getOrCreateDirectConversation } from '@/app/actions/chat-actions';
import { toast } from 'sonner';

interface NewChatModalProps {
  onConversationCreated: (conversationId: string) => void;
}

const roleLabels: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
  admin: 'Quản trị viên'
};

const roleColors: Record<string, string> = {
  teacher: 'bg-blue-50 text-blue-700 border-blue-200',
  student: 'bg-green-50 text-green-700 border-green-200',
  parent: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-amber-50 text-amber-700 border-amber-200'
};

export function NewChatModal({ onConversationCreated }: NewChatModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res = await searchUserByPhoneOrEmail(searchQuery);
    setIsSearching(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      setSearchResults(res.users || []);
      if ((res.users || []).length === 0) {
        toast.info('Không tìm thấy người dùng phù hợp');
      }
    }
  };

  const handleSelectUser = async (targetUser: any) => {
    setIsCreating(true);
    const res = await getOrCreateDirectConversation(targetUser.id);
    setIsCreating(false);

    if (res?.error) {
      toast.error(res.error);
    } else if (res?.conversationId) {
      setOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      onConversationCreated(res.conversationId);
      toast.success(`Đã mở cuộc trò chuyện với ${targetUser.full_name}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="w-full h-9 px-3 gap-1.5 justify-center" />}>
        <Plus className="w-4 h-4" />
        <span>Tin nhắn mới</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bắt đầu cuộc trò chuyện</DialogTitle>
          <DialogDescription>
            Nhập Số điện thoại hoặc Email để tìm kiếm giáo viên, phụ huynh hoặc học sinh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Nhập SĐT hoặc Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
          </Button>
        </form>

        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
          {searchResults.length === 0 && !isSearching && (
            <div className="py-8 text-center text-zinc-400 text-xs">
              Tìm theo số điện thoại hoặc email đã đăng ký tài khoản.
            </div>
          )}

          {searchResults.map((user) => (
            <div
              key={user.id}
              onClick={() => !isCreating && handleSelectUser(user)}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-zinc-200">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-700 font-semibold text-xs">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900">{user.full_name}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        roleColors[user.role] || 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {roleLabels[user.role] || user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400" /> {user.phone}
                      </span>
                    )}
                    {user.email && (
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 text-zinc-400" /> {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button size="sm" variant="ghost" className="h-8 px-2 text-primary" disabled={isCreating}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
