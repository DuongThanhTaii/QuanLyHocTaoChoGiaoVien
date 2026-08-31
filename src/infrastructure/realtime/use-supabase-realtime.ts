'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  metadata?: any;
  createdAt: string;
  senderName?: string;
  senderAvatar?: string | null;
  senderRole?: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export function useSupabaseRealtime(
  conversationId: string | null,
  currentUserId: string,
  initialMessages: ChatMessage[] = []
) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<any>(null);
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isTypingRef = useRef<boolean>(false);
  const stopTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Cập nhật messages khi initialMessages thay đổi (ví dụ đổi conversation)
  useEffect(() => {
    setMessages(initialMessages);
    setTypingUsers([]);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (!conversationId) return;

    // Tạo Realtime Channel cho conversation này
    const channel = supabase.channel(`chat-room:${conversationId}`, {
      config: {
        broadcast: { ack: false }
      }
    });

    channelRef.current = channel;

    // 1. Lắng nghe tin nhắn mới từ PostgreSQL Database
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const newMsg = payload.new as any;
        
        // Tránh trùng lặp nếu tin nhắn đã được thêm lạc quan
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          
          return [
            ...prev,
            {
              id: newMsg.id,
              conversationId: newMsg.conversation_id,
              senderId: newMsg.sender_id,
              content: newMsg.content,
              type: newMsg.type,
              metadata: newMsg.metadata,
              createdAt: newMsg.created_at,
              senderName: newMsg.sender_id === currentUserId ? 'Bạn' : 'Thành viên'
            }
          ];
        });
      }
    );

    // 2. Lắng nghe sự kiện gõ phím "..." qua Broadcast WebSocket (0 byte DB)
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { userId, userName } = payload;
      if (userId === currentUserId) return; // Bỏ qua chính mình

      // Xóa timeout cũ nếu có
      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
      }

      // Thêm vào danh sách typing nếu chưa có
      setTypingUsers((prev) => {
        if (!prev.some((u) => u.userId === userId)) {
          return [...prev, { userId, userName }];
        }
        return prev;
      });

      // Tự động xóa trạng thái typing sau 2.5s nếu không nhận thêm tín hiệu
      typingTimeoutsRef.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        delete typingTimeoutsRef.current[userId];
      }, 2500);
    });

    // 3. Lắng nghe sự kiện dừng gõ phím
    channel.on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
      const { userId } = payload;
      if (userId === currentUserId) return;

      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
        delete typingTimeoutsRef.current[userId];
      }

      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Subscribe channel
    channel.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      Object.values(typingTimeoutsRef.current).forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current = {};
    };
  }, [conversationId, currentUserId, supabase]);

  // Hàm gửi tín hiệu đang gõ phím
  const sendTypingSignal = useCallback(
    (userName: string) => {
      if (!channelRef.current || !conversationId) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId, userName }
        });
      }

      // Reset debounce stop timer
      if (stopTypingTimerRef.current) {
        clearTimeout(stopTypingTimerRef.current);
      }

      stopTypingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'stop_typing',
            payload: { userId: currentUserId }
          });
        }
      }, 2000);
    },
    [conversationId, currentUserId]
  );

  // Hàm gửi tín hiệu dừng gõ phím ngay lập tức (khi bấm gửi)
  const sendStopTypingSignal = useCallback(() => {
    if (!channelRef.current || !conversationId) return;

    if (stopTypingTimerRef.current) {
      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = null;
    }

    isTypingRef.current = false;
    channelRef.current.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: currentUserId }
    });
  }, [conversationId, currentUserId]);

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    typingUsers,
    sendTypingSignal,
    sendStopTypingSignal,
    addOptimisticMessage
  };
}
