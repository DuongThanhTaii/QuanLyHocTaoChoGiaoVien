import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'LEFT' | 'BLOCKED';

export class Enrollment extends Entity {
  private constructor(
    id: string,
    private _classId: string,
    private _studentId: string,
    private _status: EnrollmentStatus,
    private _enrolledAt: Date,
    private _leftAt: Date | null,
    private _tuitionPlanId: string | null,
    private _customFee: Money | null
  ) {
    super(id);
  }

  static create(classId: string, studentId: string, status: EnrollmentStatus = 'ACTIVE', customFee?: Money, tuitionPlanId?: string): Result<Enrollment> {
    const enrollment = new Enrollment(
      uuidv4(),
      classId,
      studentId,
      status,
      new Date(),
      null,
      tuitionPlanId || null,
      customFee || null
    );
    return Result.ok(enrollment);
  }

  get classId() { return this._classId; }
  get studentId() { return this._studentId; }
  get status() { return this._status; }
  get customFee() { return this._customFee; }
  get tuitionPlanId() { return this._tuitionPlanId; }
  get isActive() { return this._status === 'ACTIVE' || this._status === 'PENDING'; }

  leaveClass(): void {
    if (this._status !== 'LEFT') {
      this._status = 'LEFT';
      this._leftAt = new Date();
    }
  }

  updateStatus(status: EnrollmentStatus): void {
    this._status = status;
    if (status === 'LEFT') {
      this._leftAt = new Date();
    }
  }
}
