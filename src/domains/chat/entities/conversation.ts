import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { v4 as uuidv4 } from 'uuid';

export type ConversationType = 'direct' | 'group';

export class Conversation extends AggregateRoot {
  private constructor(
    id: string,
    private _type: ConversationType,
    private _name: string | null, // Null for direct
    private _classId: string | null, // Associated class if group
    private _participants: string[], // User IDs
    private _createdAt: Date,
    private _lastMessageAt: Date | null
  ) {
    super(id);
  }

  static createDirect(user1Id: string, user2Id: string): Result<Conversation> {
    if (user1Id === user2Id) return Result.fail(new DomainError("Cannot create conversation with self"));
    
    return Result.ok(new Conversation(
      uuidv4(),
      'direct',
      null,
      null,
      [user1Id, user2Id].sort(),
      new Date(),
      null
    ));
  }

  static createGroup(classId: string, name: string, participants: string[]): Result<Conversation> {
    if (participants.length < 2) return Result.fail(new DomainError("Group must have at least 2 participants"));
    
    return Result.ok(new Conversation(
      uuidv4(),
      'group',
      name,
      classId,
      [...new Set(participants)], // Unique
      new Date(),
      null
    ));
  }

  updateLastMessage(): void {
    this._lastMessageAt = new Date();
  }

  get type() { return this._type; }
  get participants() { return this._participants; }
}
