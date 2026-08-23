import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { v4 as uuidv4 } from 'uuid';

export class ScheduleSlot extends Entity {
  private constructor(
    id: string,
    private _classId: string,
    private _title: string | null,
    private _dayOfWeek: number, // 0 = Sunday, 1 = Monday, etc.
    private _startTime: string, // "HH:MM"
    private _endTime: string,
    private _room: string | null,
    private _isRecurring: boolean,
    private _specificDate: Date | null
  ) {
    super(id);
  }

  static createRecurring(
    classId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    room?: string
  ): Result<ScheduleSlot> {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return Result.fail(new DomainError("Invalid day of week (0-6)"));
    }
    
    // Basic time validation HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return Result.fail(new DomainError("Invalid time format, expected HH:MM"));
    }

    if (startTime >= endTime) {
      return Result.fail(new DomainError("Start time must be before end time"));
    }

    const slot = new ScheduleSlot(
      uuidv4(), classId, null, dayOfWeek, startTime, endTime, room || null, true, null
    );
    return Result.ok(slot);
  }

  get classId() { return this._classId; }
  get dayOfWeek() { return this._dayOfWeek; }
  get startTime() { return this._startTime; }
  get endTime() { return this._endTime; }

  conflictsWith(other: ScheduleSlot): boolean {
    if (this._dayOfWeek !== other._dayOfWeek) return false;
    if (this._specificDate || other._specificDate) return false; // Simple check, complex logic needed for specific dates
    return this._startTime < other._endTime && this._endTime > other._startTime;
  }
}
