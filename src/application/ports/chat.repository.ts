import { Conversation } from '../../domains/chat/entities/conversation';
import { Message } from '../../domains/chat/entities/message';

export interface IChatRepository {
  findConversationById(id: string): Promise<Conversation | null>;
  findConversationsByUserId(userId: string): Promise<Conversation[]>;
  saveConversation(conversation: Conversation): Promise<void>;
  
  findMessagesByConversationId(conversationId: string, limit: number, offset: number): Promise<Message[]>;
  saveMessage(message: Message): Promise<void>;
}
