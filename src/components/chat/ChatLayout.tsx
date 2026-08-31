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
import { Send, MessageSquare, Loader2 } from 'lucide-react';
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

  // Hook Supabase Realtime
  const {
    messages,
    typingUsers,
    sendTypingSignal,
    sendStopTypingSignal,
    addOptimisticMessage
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

  // 2. Tải tin nhắn khi đổi activeConversationId
  useEffect(() => {
    if (!activeConversationId) {
      setInitialMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    markConversationAsRead(activeConversationId);

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
    const text = inputText.trim();
    if (!text || !activeConversationId || isSending) return;

    setInputText('');
    sendStopTypingSignal();

    // Thêm tin nhắn lạc quan (Optimistic update)
    const tempId = `temp-${Date.now()}`;
    addOptimisticMessage({
      id: tempId,
      conversationId: activeConversationId,
      senderId: currentUserId,
      content: text,
      type: 'text',
      createdAt: new Date().toISOString(),
      senderName: 'Bạn'
    });

    setIsSending(true);
    const res = await sendMessage(activeConversationId, text);
    setIsSending(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      // Cập nhật lại danh sách hội thoại để cập nhật tin nhắn cuối
      loadConversations(false);
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
          onSelectConversation={(id) => setActiveConversationId(id)}
          onNewConversation={handleConversationCreatedOrSelected}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* Cột 2: Khung Chat */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 bg-white ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
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
              <div className="flex-1 flex items-center justify-center bg-zinc-50/50">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
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
            <div className="p-3 bg-white border-t border-zinc-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 h-10 px-4 rounded-full border border-zinc-200 bg-zinc-50 focus:bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-full w-10 h-10 shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 bg-zinc-50/30">
            <div className="p-4 bg-zinc-100 rounded-full mb-3 text-zinc-500">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-700">Chọn cuộc trò chuyện</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
