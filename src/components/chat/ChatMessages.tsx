'use client';

import React, { useEffect, useRef } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage, TypingUser } from '@/infrastructure/realtime/use-supabase-realtime';
import { MessageSquarePlus, Receipt } from 'lucide-react';

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

function formatDateDivider(dateString: string) {
  try {
    const d = new Date(dateString);
    const now = new Date();
    
    // Check if today
    if (d.toDateString() === now.toDateString()) {
      return 'Hôm nay';
    }

    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }

    // Format full date in Vietnamese
    const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (year === now.getFullYear()) {
      return `${weekday}, ${day}/${month}`;
    }
    return `${weekday}, ${day}/${month}/${year}`;
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
    <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-background/50">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-2xs">
            <MessageSquarePlus className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Chưa có tin nhắn nào</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện nhé! 👋
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const isSystem = msg.type === 'system';

          // Date divider calculation
          const prevMsg = messages[index - 1];
          const showDateDivider = !prevMsg || 
            new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

          if (isSystem) {
            return (
              <React.Fragment key={msg.id || index}>
                {showDateDivider && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 px-3 py-0.5 rounded-full border border-border/40 shadow-2xs">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-center my-2">
                  <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/40">
                    {msg.content}
                  </span>
                </div>
              </React.Fragment>
            );
          }

          // Kiểm tra xem tin nhắn tiếp theo có cùng người gửi không để ẩn avatar / gom nhóm
          const nextMsg = messages[index + 1];
          const isLastFromSender = !nextMsg || nextMsg.senderId !== msg.senderId;
          const isFirstFromSender = !prevMsg || prevMsg.senderId !== msg.senderId;

          return (
            <React.Fragment key={msg.id || index}>
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 px-3 py-0.5 rounded-full border border-border/40 shadow-2xs">
                    {formatDateDivider(msg.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'} ${
                  isLastFromSender ? 'mb-2.5' : 'mb-0.5'
                }`}
              >
                {!isMe && isGroup && (
                  <div className="w-7 shrink-0">
                    {isLastFromSender ? (
                      <UserAvatar name={msg.senderName} size="sm" className="w-7 h-7 text-[10px]" />
                    ) : null}
                  </div>
                )}

                <div className={`max-w-[78%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && isGroup && isFirstFromSender && (
                    <div className="text-[11px] font-semibold text-muted-foreground pl-1 mb-1">
                      {msg.senderName}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed break-words shadow-2xs transition-all ${
                      isMe
                        ? `bg-primary text-primary-foreground rounded-2xl ${
                            isLastFromSender ? 'rounded-br-xs' : 'rounded-br-md'
                          }`
                        : `bg-muted/90 text-foreground border border-border/50 rounded-2xl ${
                            isLastFromSender ? 'rounded-bl-xs' : 'rounded-bl-md'
                          }`
                    }`}
                  >
                    {msg.type === 'invoice_link' && (
                      <div className={`flex items-center gap-1.5 font-semibold text-xs mb-1.5 pb-1.5 border-b ${
                        isMe ? 'border-primary-foreground/20 text-primary-foreground' : 'border-border/60 text-primary'
                      }`}>
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Hóa đơn học phí</span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    <div
                      className={`text-[10px] mt-1 text-right font-normal tracking-wide ${
                        isMe ? 'text-primary-foreground/75' : 'text-muted-foreground/80'
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      <div ref={bottomRef} />
    </div>
  );
}
