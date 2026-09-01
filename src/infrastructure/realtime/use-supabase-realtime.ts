'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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

  // Singleton browser client qua useMemo để không bao giờ bị re-instantiate trong lifecycle
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // Cập nhật messages khi initialMessages thay đổi (ví dụ đổi conversation)
  useEffect(() => {
    setMessages(initialMessages);
    setTypingUsers([]);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (!conversationId) return;

    // Tạo Realtime Channel duy nhất cho conversation này
    const channel = supabase.channel(`chat-room:${conversationId}`, {
      config: {
        broadcast: { ack: false, self: false }
      }
    });

    channelRef.current = channel;

    // 1. Lắng nghe tin nhắn mới từ PostgreSQL Database Changes
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
        if (!newMsg) return;

        setMessages((prev) => {
          // 1. Tránh trùng lặp nếu đã nhận qua broadcast hoặc real id đã có
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }

          // 2. Nếu là tin nhắn của chính mình, thay thế tin nhắn tạm (temp-) cùng nội dung
          if (newMsg.sender_id === currentUserId) {
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith('temp-') && m.content === newMsg.content
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = {
                id: newMsg.id,
                conversationId: newMsg.conversation_id,
                senderId: newMsg.sender_id,
                content: newMsg.content,
                type: newMsg.type,
                metadata: newMsg.metadata,
                createdAt: newMsg.created_at,
                senderName: 'Bạn'
              };
              return updated;
            }
          }

          // 3. Thêm tin nhắn mới bình thường
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

    // 2. Lắng nghe tin nhắn mới qua WebSocket Broadcast (nhận ngay lập tức < 10ms giữa 2 client)
    channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      const { message } = payload;
      if (!message || message.senderId === currentUserId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Khi người kia gửi tin nhắn, lập tức xóa trạng thái typing của họ
      if (message.senderId) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== message.senderId));
      }
    });

    // 3. Lắng nghe sự kiện gõ phím "..." qua Broadcast WebSocket (0 byte DB)
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { userId, userName } = payload;
      if (!userId || userId === currentUserId) return; // Bỏ qua chính mình

      // Xóa timeout cũ nếu có
      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
      }

      // Thêm vào danh sách typing
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

    // 4. Lắng nghe sự kiện dừng gõ phím
    channel.on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
      const { userId } = payload;
      if (!userId || userId === currentUserId) return;

      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
        delete typingTimeoutsRef.current[userId];
      }

      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Subscribe channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel sẵn sàng nhận gửi realtime
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
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

  // Hàm broadcast tin nhắn mới tức thì cho các thành viên trong room
  const broadcastNewMessage = useCallback(
    (message: ChatMessage) => {
      if (!channelRef.current || !conversationId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message }
      });
    },
    [conversationId]
  );

  const addOptimisticMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const confirmOptimisticMessage = useCallback((tempId: string, realMessage: ChatMessage) => {
    setMessages((prev) => {
      // Nếu đã có tin thật từ postgres_changes
      if (prev.some((m) => m.id === realMessage.id)) {
        return prev.filter((m) => m.id !== tempId);
      }
      // Thay thế tin temp bằng tin thật
      const idx = prev.findIndex((m) => m.id === tempId);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = realMessage;
        return copy;
      }
      return [...prev, realMessage];
    });
  }, []);

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  return {
    messages,
    typingUsers,
    sendTypingSignal,
    sendStopTypingSignal,
    broadcastNewMessage,
    addOptimisticMessage,
    confirmOptimisticMessage,
    removeOptimisticMessage
  };
}
