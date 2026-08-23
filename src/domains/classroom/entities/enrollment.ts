import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

export class Enrollment extends Entity {
  private constructor(
    id: string,
    private _classId: string,
    private _studentId: string,
    private _enrolledAt: Date,
    private _leftAt: Date | null,
    private _customFee: Money | null
  ) {
    super(id);
  }

  static create(classId: string, studentId: string, customFee?: Money): Result<Enrollment> {
    const enrollment = new Enrollment(
      uuidv4(),
      classId,
      studentId,
      new Date(),
      null,
      customFee || null
    );
    return Result.ok(enrollment);
  }

  get classId() { return this._classId; }
  get studentId() { return this._studentId; }
  get customFee() { return this._customFee; }
  get isActive() { return this._leftAt === null; }

  leaveClass(): void {
    if (this._leftAt === null) {
      this._leftAt = new Date();
    }
  }
}
