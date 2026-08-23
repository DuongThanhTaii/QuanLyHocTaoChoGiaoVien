import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { DomainEvent } from '../../shared/domain-event';
import { v4 as uuidv4 } from 'uuid';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

export class AttendanceMarkedEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'ATTENDANCE_MARKED';
  constructor(
    public readonly recordId: string,
    public readonly studentId: string,
    public readonly classId: string,
    public readonly status: AttendanceStatus
  ) {}
}

export class AttendanceRecord extends Entity {
  private constructor(
    id: string,
    private _slotId: string,
    private _studentId: string,
    private _classId: string,
    private _status: AttendanceStatus,
    private _markedBy: string,
    private _markedAt: Date,
    private _note: string | null
  ) {
    super(id);
  }

  static mark(
    slotId: string,
    studentId: string,
    classId: string,
    status: AttendanceStatus,
    markedBy: string,
    note?: string
  ): Result<AttendanceRecord> {
    const record = new AttendanceRecord(
      uuidv4(),
      slotId,
      studentId,
      classId,
      status,
      markedBy,
      new Date(),
      note || null
    );
    return Result.ok(record);
  }

  updateStatus(newStatus: AttendanceStatus, updatedBy: string, note?: string): Result<void> {
    this._status = newStatus;
    this._markedBy = updatedBy;
    this._markedAt = new Date();
    if (note !== undefined) {
      this._note = note || null;
    }
    return Result.ok(undefined);
  }

  get status() { return this._status; }
  get studentId() { return this._studentId; }
  get slotId() { return this._slotId; }
  get classId() { return this._classId; }
}
