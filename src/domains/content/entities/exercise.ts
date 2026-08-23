import { Entity } from '../../shared/entity';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { v4 as uuidv4 } from 'uuid';

export class Exercise extends Entity {
  private constructor(
    id: string,
    private _lessonId: string | null,
    private _classId: string,
    private _title: string,
    private _description: string | null,
    private _dueDate: Date | null,
    private _maxScore: number | null,
    private _attachments: string[] = [] // Array of storage paths
  ) {
    super(id);
  }

  static create(
    classId: string,
    title: string,
    lessonId?: string,
    description?: string,
    dueDate?: Date,
    maxScore?: number
  ): Result<Exercise> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new DomainError("Exercise title is required"));
    }

    const exercise = new Exercise(
      uuidv4(),
      lessonId || null,
      classId,
      title,
      description || null,
      dueDate || null,
      maxScore || null
    );

    return Result.ok(exercise);
  }

  addAttachment(path: string): void {
    this._attachments.push(path);
  }

  get title() { return this._title; }
  get dueDate() { return this._dueDate; }
  get classId() { return this._classId; }
}
