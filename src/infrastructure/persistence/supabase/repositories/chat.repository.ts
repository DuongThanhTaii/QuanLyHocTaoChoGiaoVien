import { SupabaseClient } from '@supabase/supabase-js';
import { Conversation } from '../../../../domains/chat/entities/conversation';
import { Message } from '../../../../domains/chat/entities/message';
import { IChatRepository } from '../../../../application/ports/chat.repository';

export class SupabaseChatRepository implements IChatRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toConversationDomain(row: any, participants: string[]): Conversation {
    const entity = Object.create(Conversation.prototype);
    Object.assign(entity, {
      _id: row.id,
      _type: row.type,
      _name: row.title,
      _classId: row.class_id,
      _participants: participants,
      _createdAt: new Date(row.created_at),
      _lastMessageAt: row.last_message_at ? new Date(row.last_message_at) : null,
    });
    return entity;
  }

  private toMessageDomain(row: any): Message {
    const entity = Object.create(Message.prototype);
    Object.assign(entity, {
      _id: row.id,
      _conversationId: row.conversation_id,
      _senderId: row.sender_id,
      _type: row.type,
      _content: row.content,
      _metadata: row.metadata,
      _createdAt: new Date(row.created_at),
      _readBy: row.read_by || [],
    });
    return entity;
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    const { data: conv, error: convError } = await this.client
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') return null;
      throw new Error(`Failed to find conversation: ${convError.message}`);
    }

    const { data: participants, error: partError } = await this.client
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', id);

    if (partError) {
      throw new Error(`Failed to fetch participants: ${partError.message}`);
    }

    return this.toConversationDomain(conv, participants.map(p => p.user_id));
  }

  async findConversationsByUserId(userId: string): Promise<Conversation[]> {
    const { data: participantRows, error: partError } = await this.client
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      throw new Error(`Failed to fetch user conversations: ${partError.message}`);
    }
    
    if (!participantRows || participantRows.length === 0) return [];
    
    const conversationIds = participantRows.map(p => p.conversation_id);

    const { data: conversations, error: convError } = await this.client
      .from('conversations')
      .select('*, conversation_participants(user_id)')
      .in('id', conversationIds);

    if (convError) {
      throw new Error(`Failed to fetch conversations: ${convError.message}`);
    }

    return conversations.map(c => 
      this.toConversationDomain(c, c.conversation_participants.map((p: any) => p.user_id))
    );
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const anyConv = conversation as any;
    
    const { error: convError } = await this.client
      .from('conversations')
      .upsert({
        id: anyConv._id,
        type: anyConv._type,
        title: anyConv._name,
        class_id: anyConv._classId,
        created_at: anyConv._createdAt.toISOString()
      });

    if (convError) {
      throw new Error(`Failed to save conversation: ${convError.message}`);
    }

    if (anyConv._participants && anyConv._participants.length > 0) {
      const participantsData = anyConv._participants.map((userId: string) => ({
        conversation_id: anyConv._id,
        user_id: userId,
        joined_at: new Date().toISOString()
      }));

      const { error: partError } = await this.client
        .from('conversation_participants')
        .upsert(participantsData, { onConflict: 'conversation_id,user_id' });

      if (partError) {
        throw new Error(`Failed to save participants: ${partError.message}`);
      }
    }
  }

  async findMessagesByConversationId(conversationId: string, limit: number, offset: number): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to find messages: ${error.message}`);
    }

    return data.map(row => this.toMessageDomain(row));
  }

  async saveMessage(message: Message): Promise<void> {
    const anyMsg = message as any;
    
    const { error } = await this.client
      .from('messages')
      .upsert({
        id: anyMsg._id,
        conversation_id: anyMsg._conversationId,
        sender_id: anyMsg._senderId,
        content: anyMsg._content,
        type: anyMsg._type,
        metadata: anyMsg._metadata,
        created_at: anyMsg._createdAt.toISOString(),
      });

    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }
}
