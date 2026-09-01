'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ConversationList } from './ConversationList';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { useSupabaseRealtime } from '@/infrastructure/realtime/use-supabase-realtime';
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead
} from '@/app/actions/chat-actions';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ChatLayoutProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: string;
  initialConversationId?: string;
}

export function ChatLayout({
  currentUserId,
  currentUserName,
  currentUserRole,
  initialConversationId
}: ChatLayoutProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  // Hook Supabase Realtime
  const {
    messages,
    typingUsers,
    sendTypingSignal,
    sendStopTypingSignal,
    broadcastNewMessage,
    addOptimisticMessage,
    confirmOptimisticMessage,
    removeOptimisticMessage
  } = useSupabaseRealtime(activeConversationId, currentUserId, initialMessages);

  // 1. Tải danh sách conversations
  const loadConversations = async (autoSelectFirst = true) => {
    const res = await getUserConversations();
    const convs = res.conversations || [];
    setConversations(convs);
    setIsLoadingConversations(false);

    if (autoSelectFirst && convs.length > 0 && !activeConversationId) {
      setActiveConversationId(convs[0].id);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isUnread: false } : c))
    );
    markConversationAsRead(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:read', { detail: { conversationId: id } }));
    }
  };

  // 2. Tải tin nhắn khi đổi activeConversationId
  useEffect(() => {
    if (!activeConversationId) {
      setInitialMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, isUnread: false } : c))
    );
    markConversationAsRead(activeConversationId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chat:read', { detail: { conversationId: activeConversationId } }));
    }

    getConversationMessages(activeConversationId)
      .then((res) => {
        setInitialMessages(res.messages || []);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [activeConversationId]);

  // Tìm thông tin cuộc trò chuyện đang mở
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Xử lý gõ phím -> gửi typing event
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      sendTypingSignal(currentUserName);
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingRef.current) return;

    const text = inputText.trim();
    if (!text || !activeConversationId) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputText('');
    sendStopTypingSignal();

    // Thêm tin nhắn lạc quan (Optimistic update)
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: currentUserId,
      content: text,
      type: 'text',
      createdAt: new Date().toISOString(),
      senderName: 'Bạn'
    };
    addOptimisticMessage(optimisticMsg);

    try {
      const res = await sendMessage(activeConversationId, text);

      if (res?.error) {
        toast.error(res.error);
        removeOptimisticMessage(tempId);
      } else if (res?.message) {
        confirmOptimisticMessage(tempId, res.message);
        // Broadcast ngay lập tức cho partner qua WebSocket
        broadcastNewMessage(res.message);
        // Cập nhật lại danh sách hội thoại để cập nhật preview tin nhắn cuối
        loadConversations(false);
      }
    } catch (err: any) {
      toast.error('Lỗi khi gửi tin nhắn: ' + (err?.message || 'Vui lòng thử lại'));
      removeOptimisticMessage(tempId);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  };

  const handleConversationCreatedOrSelected = (convId: string) => {
    setActiveConversationId(convId);
    loadConversations(false);
  };

  const handleLeaveOrDelete = () => {
    setActiveConversationId(null);
    loadConversations(true);
  };

  const handleTitleUpdated = (newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, title: newTitle } : c))
    );
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex h-[calc(100vh-10rem)] min-h-[550px]">
      {/* Cột 1: Sidebar danh sách cuộc trò chuyện */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleConversationCreatedOrSelected}
          currentUserRole={currentUserRole}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Cột 2: Khung Chat */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 bg-white ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {isLoadingConversations ? (
          <div className="flex-1 flex flex-col h-full bg-white animate-pulse">
            {/* Header skeleton */}
            <div className="h-16 px-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
            {/* Messages feed skeleton */}
            <div className="flex-1 p-4 space-y-4 bg-zinc-50/30">
              <div className="flex items-start gap-2 max-w-[70%]">
                <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
                <div className="space-y-1">
                  <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-none" />
                </div>
              </div>
              <div className="flex items-start justify-end gap-2 ml-auto max-w-[70%]">
                <div className="space-y-1 flex flex-col items-end">
                  <Skeleton className="h-12 w-56 rounded-2xl rounded-tr-none bg-primary/20" />
                </div>
              </div>
              <div className="flex items-start gap-2 max-w-[70%]">
                <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
                <div className="space-y-1">
                  <Skeleton className="h-8 w-36 rounded-2xl rounded-tl-none" />
                </div>
              </div>
            </div>
          </div>
        ) : activeConversation ? (
          <>
            {/* Header */}
            <ChatHeader
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBack={() => setActiveConversationId(null)}
              onLeaveOrDelete={handleLeaveOrDelete}
              onTitleUpdated={handleTitleUpdated}
            />

            {/* Messages Feed */}
            {isLoadingMessages ? (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-zinc-50/30">
                <div className="flex items-start gap-2 max-w-[70%]">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
                  <div className="space-y-1">
                    <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-none bg-muted" />
                    <Skeleton className="h-2.5 w-12 ml-1" />
                  </div>
                </div>
                <div className="flex items-start justify-end gap-2 ml-auto max-w-[70%]">
                  <div className="space-y-1 flex flex-col items-end">
                    <Skeleton className="h-14 w-60 rounded-2xl rounded-tr-none bg-primary/20" />
                    <Skeleton className="h-2.5 w-12 mr-1" />
                  </div>
                </div>
                <div className="flex items-start gap-2 max-w-[70%]">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
                  <div className="space-y-1">
                    <Skeleton className="h-8 w-36 rounded-2xl rounded-tl-none bg-muted" />
                    <Skeleton className="h-2.5 w-12 ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <ChatMessages
                messages={messages}
                currentUserId={currentUserId}
                isGroup={activeConversation.type === 'group'}
                typingUsers={typingUsers}
              />
            )}

            {/* Input Form */}
            <div className="p-3 bg-card border-t border-border/60">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-10 px-4 rounded-full border border-border/60 bg-muted/40 focus:bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-background/50">
            <div className="p-4 bg-muted/80 rounded-2xl mb-3 text-muted-foreground shadow-2xs border border-border/40">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Chọn cuộc trò chuyện</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
