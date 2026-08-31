'use client';

import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage, TypingUser } from '@/infrastructure/realtime/use-supabase-realtime';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  isGroup: boolean;
  typingUsers: TypingUser[];
}

function formatMessageTime(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatMessages({
  messages,
  currentUserId,
  isGroup,
  typingUsers
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages or typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-8">
          <p className="text-sm font-medium">Chưa có tin nhắn nào</p>
          <p className="text-xs text-zinc-400 mt-1">Hãy gửi lời chào để bắt đầu cuộc trò chuyện! 👋</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const isSystem = msg.type === 'system';

          if (isSystem) {
            return (
              <div key={msg.id || index} className="flex justify-center my-2">
                <span className="text-[11px] text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/60">
                  {msg.content}
                </span>
              </div>
            );
          }

          // Kiểm tra xem tin nhắn tiếp theo có cùng người gửi không để ẩn avatar
          const nextMsg = messages[index + 1];
          const isLastFromSender = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <div
              key={msg.id || index}
              className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && isGroup && (
                <div className="w-7 shrink-0">
                  {isLastFromSender ? (
                    <UserAvatar name={msg.senderName} size="sm" className="w-7 h-7 text-[10px]" />
                  ) : null}
                </div>
              )}

              <div className={`max-w-[75%] sm:max-w-[65%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && isGroup && isLastFromSender && (
                  <div className="text-[11px] font-semibold text-zinc-500 pl-1">
                    {msg.senderName}
                  </div>
                )}

                <div
                  className={`p-3 text-sm leading-relaxed break-words shadow-2xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-xs'
                      : 'bg-white text-zinc-900 border border-zinc-200/80 rounded-2xl rounded-bl-xs'
                  }`}
                >
                  {msg.type === 'invoice_link' && (
                    <div className="flex items-center gap-1.5 font-semibold text-xs mb-1.5 pb-1.5 border-b border-white/20">
                      <span>🧾</span>
                      <span>Hóa đơn học phí</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div
                    className={`text-[10px] mt-1 text-right font-normal ${
                      isMe ? 'text-blue-100' : 'text-zinc-400'
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      <div ref={bottomRef} />
    </div>
  );
}
