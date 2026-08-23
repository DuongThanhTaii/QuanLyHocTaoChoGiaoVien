import { IChatRepository } from '../ports/chat.repository';
import { Message } from '../../domains/chat/entities/message';
import { Result } from '../../domains/shared/result';

export class ChatService {
  constructor(private chatRepo: IChatRepository) {}

  async sendTextMessage(conversationId: string, senderId: string, content: string): Promise<Result<Message>> {
    const conversation = await this.chatRepo.findConversationById(conversationId);
    if (!conversation) return Result.fail(new Error("Conversation not found"));
    if (!conversation.participants.includes(senderId)) return Result.fail(new Error("Sender not in conversation"));

    const messageResult = Message.createText(conversationId, senderId, content);
    if (!messageResult.isSuccess()) return messageResult;

    await this.chatRepo.saveMessage(messageResult.getValue());
    
    // Update conversation last message timestamp
    conversation.updateLastMessage();
    await this.chatRepo.saveConversation(conversation);
    
    // Broadcast via Realtime would happen via domain events or adapters at infrastructure layer
    
    return messageResult;
  }
}
