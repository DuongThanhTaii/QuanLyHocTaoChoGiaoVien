## 1. Kien truc Chat

```
+-----------------------------------------------------------+
|                    Chat Architecture                       |
+-----------------------------------------------------------+
|                                                            |
|  Client A          Supabase Realtime          Client B    |
|     |                    |                       |          |
|     | send message       |                       |          |
|     |------------------->|                       |          |
|     |                    | INSERT messages     |          |
|     |                    |------------------->|          |
|     |                    |                       |          |
|     |                    | Broadcast event     |          |
|     |                    |------------------->|          |
|     |                    |                       |          |
|     |<-------------------|                       |          |
|     | receive update     |                       |          |
|     |                    |                       |          |
+-----------------------------------------------------------+
```

## 2. Conversation Types

```typescript
// src/domains/chat/entities/conversation.ts
export enum ConversationType {
  DIRECT = 'direct',      // 1-1: GV-HS hoac GV-PH
  CLASS_GROUP = 'class',  // Nhom lop: GV + HS + PH
  SUPPORT = 'support'     // Ho tro tu admin
}

export class Conversation extends AggregateRoot {
  private constructor(
    id: string,
    private type: ConversationType,
    private title: string | null,
    private classId: string | null,
    private participants: ConversationParticipant[],
    private messages: Message[] = [],
    private lastMessageAt: Date | null = null
  ) {
    super(id);
  }

  static createDirect(userA: string, userB: string): Result<Conversation> {
    const conv = new Conversation(
      generateId(),
      ConversationType.DIRECT,
      null,
      null,
      [
        new ConversationParticipant(userA),
        new ConversationParticipant(userB)
      ]
    );
    return Result.ok(conv);
  }

  static createClassGroup(classId: string, teacherId: string): Result<Conversation> {
    const conv = new Conversation(
      generateId(),
      ConversationType.CLASS_GROUP,
      'Nhom lop',
      classId,
      [new ConversationParticipant(teacherId, 'admin')]
    );
    return Result.ok(conv);
  }

  addMessage(senderId: string, content: string, type: MessageType = 'text'): Result<Message> {
    if (!this.isParticipant(senderId)) {
      return Result.fail(new DomainError("User is not a participant"));
    }
    
    const message = Message.create({
      conversationId: this.id,
      senderId,
      content,
      type
    });
    
    this.messages.push(message);
    this.lastMessageAt = new Date();
    this.addDomainEvent(new MessageSentEvent(this.id, message.id));
    
    return Result.ok(message);
  }

  private isParticipant(userId: string): boolean {
    return this.participants.some(p => p.userId === userId);
  }
}
```

## 3. Message Types & Rich Content

```typescript
// src/domains/chat/entities/message.ts
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  INVOICE = 'invoice',
  ATTENDANCE = 'attendance',
  SYSTEM = 'system'
}

export interface MessageMetadata {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  invoiceId?: string;
  attendanceRecordId?: string;
}

export class Message extends Entity {
  constructor(
    id: string,
    private conversationId: string,
    private senderId: string,
    private content: string,
    private type: MessageType,
    private metadata: MessageMetadata | null,
    private replyTo: string | null,
    private editedAt: Date | null,
    private createdAt: Date
  ) {
    super(id);
  }

  static create(props: CreateMessageProps): Message {
    return new Message(
      generateId(),
      props.conversationId,
      props.senderId,
      props.content,
      props.type,
      props.metadata ?? null,
      props.replyTo ?? null,
      null,
      new Date()
    );
  }

  edit(newContent: string, userId: string): Result<void> {
    if (this.senderId !== userId) {
      return Result.fail(new DomainError("Only sender can edit message"));
    }
    
    const timeDiff = Date.now() - this.createdAt.getTime();
    if (timeDiff > 15 * 60 * 1000) { // 15 phut
      return Result.fail(new DomainError("Message can only be edited within 15 minutes"));
    }
    
    this.content = newContent;
    this.editedAt = new Date();
    return Result.ok(undefined);
  }
}
```

## 4. Realtime Implementation

```typescript
// src/infrastructure/realtime/chat-realtime.service.ts
export class ChatRealtimeService {
  constructor(private supabase: SupabaseClient) {}

  subscribeToConversation(
    conversationId: string,
    onMessage: (message: Message) => void
  ): RealtimeChannel {
    return this.supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          onMessage(this.mapToMessage(payload.new));
        }
      )
      .subscribe();
  }

  subscribeToTyping(
    conversationId: string,
    onTyping: (userId: string) => void
  ): RealtimeChannel {
    return this.supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        onTyping(payload.userId);
      })
      .subscribe();
  }

  sendTypingIndicator(conversationId: string, userId: string): void {
    this.supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId }
      });
  }
}
```

## 5. Chat UI Components

```typescript
// Chat layout cho tung role
// Teacher view
<ChatLayout>
  <ConversationList 
    filter={{ role: ['student', 'parent'] }}
    showClassGroups={true}
  />
  <ChatWindow>
    <MessageList 
      showAttendanceButton={true}
      showInvoiceButton={true}
    />
    <MessageInput 
      allowFileUpload={true}
      allowVoiceNote={true}
    />
  </ChatWindow>
</ChatLayout>

// Parent view
<ChatLayout>
  <ConversationList 
    filter={{ role: ['teacher'] }}
    showUnreadOnly={false}
  />
  <ChatWindow>
    <MessageList />
    <QuickActions>
      <PayInvoiceButton />
      <ViewProgressButton />
    </QuickActions>
  </ChatWindow>
</ChatLayout>
```

## 6. Notification Strategy

```typescript
// src/application/services/notification/chat-notification.service.ts
export class ChatNotificationService {
  async notifyNewMessage(message: Message): Promise<void> {
    const conversation = await this.conversationRepo.findById(message.conversationId);
    
    for (const participant of conversation.participants) {
      if (participant.userId === message.senderId) continue;
      if (participant.isOnline) continue;
      
      const user = await this.userRepo.findById(participant.userId);
      
      // Push notification
      await this.pushService.send({
        userId: participant.userId,
        title: `Tin nhan moi tu ${message.senderName}`,
        body: message.content.substring(0, 100),
        data: { conversationId: message.conversationId }
      });
      
      // Email notification (neu khong online > 30 phut)
      if (participant.lastSeenAt && 
          Date.now() - participant.lastSeenAt.getTime() > 30 * 60 * 1000) {
        await this.emailService.sendChatNotification(user.email, message);
      }
    }
  }
}
```
""")
