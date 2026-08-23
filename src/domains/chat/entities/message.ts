import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { v4 as uuidv4 } from 'uuid';

export type MessageType = 'text' | 'image' | 'file' | 'invoice_link';

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  invoiceId?: string;
  amount?: number;
}

export class Message extends Entity {
  private constructor(
    id: string,
    private _conversationId: string,
    private _senderId: string,
    private _type: MessageType,
    private _content: string, // Text content or file URL
    private _metadata: MessageMetadata | null,
    private _createdAt: Date,
    private _readBy: string[]
  ) {
    super(id);
  }

  static createText(conversationId: string, senderId: string, content: string): Result<Message> {
    if (!content || content.trim().length === 0) {
      return Result.fail(new DomainError("Message content cannot be empty"));
    }
    
    return Result.ok(new Message(
      uuidv4(), conversationId, senderId, 'text', content, null, new Date(), [senderId]
    ));
  }

  static createFile(
    conversationId: string, 
    senderId: string, 
    fileUrl: string, 
    fileName: string, 
    fileSize: number
  ): Result<Message> {
    return Result.ok(new Message(
      uuidv4(), conversationId, senderId, 'file', fileUrl, 
      { fileName, fileSize }, new Date(), [senderId]
    ));
  }

  static createInvoiceLink(
    conversationId: string, 
    senderId: string, 
    invoiceId: string, 
    amount: number
  ): Result<Message> {
    return Result.ok(new Message(
      uuidv4(), conversationId, senderId, 'invoice_link', `Hóa đơn mới: ${amount.toLocaleString('vi-VN')} đ`, 
      { invoiceId, amount }, new Date(), [senderId]
    ));
  }

  markAsRead(userId: string): void {
    if (!this._readBy.includes(userId)) {
      this._readBy.push(userId);
    }
  }

  get conversationId() { return this._conversationId; }
  get type() { return this._type; }
  get content() { return this._content; }
}
