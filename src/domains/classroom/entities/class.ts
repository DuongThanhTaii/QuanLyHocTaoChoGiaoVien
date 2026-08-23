import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { Money } from '../../shared/value-objects';
import { v4 as uuidv4 } from 'uuid';

export type FeeType = 'per_session' | 'per_month' | 'per_course';

export interface ClassProps {
  teacherId: string;
  name: string;
  subject?: string;
  description?: string;
  feePerSession: Money;
  feeType: FeeType;
  color?: string;
  isActive: boolean;
}

export class Classroom extends AggregateRoot {
  private constructor(
    id: string,
    private _teacherId: string,
    private _name: string,
    private _subject: string | null,
    private _description: string | null,
    private _feePerSession: Money,
    private _feeType: FeeType,
    private _color: string,
    private _isActive: boolean
  ) {
    super(id);
  }

  static create(props: ClassProps): Result<Classroom> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail(new DomainError("Class name is required"));
    }

    const classroom = new Classroom(
      uuidv4(),
      props.teacherId,
      props.name,
      props.subject || null,
      props.description || null,
      props.feePerSession,
      props.feeType,
      props.color || '#3B82F6',
      props.isActive !== undefined ? props.isActive : true
    );

    return Result.ok(classroom);
  }

  get teacherId() { return this._teacherId; }
  get name() { return this._name; }
  get feePerSession() { return this._feePerSession; }
  get feeType() { return this._feeType; }
  get isActive() { return this._isActive; }

  deactivate(): void {
    this._isActive = false;
  }
}
