import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { v4 as uuidv4 } from 'uuid';

export class Material {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly storagePath: string,
    public readonly fileType: string,
    public readonly sizeBytes: number,
    public readonly uploadedBy: string
  ) {}
}

export class Lesson extends AggregateRoot {
  private constructor(
    id: string,
    private _classId: string,
    private _title: string,
    private _content: string | null, // e.g. JSON or Markdown
    private _weekNumber: number | null,
    private _date: Date | null,
    private _createdBy: string,
    private _materials: Material[] = []
  ) {
    super(id);
  }

  static create(
    classId: string,
    title: string,
    createdBy: string,
    content?: string,
    weekNumber?: number,
    date?: Date
  ): Result<Lesson> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new DomainError("Lesson title is required"));
    }

    const lesson = new Lesson(
      uuidv4(),
      classId,
      title,
      content || null,
      weekNumber || null,
      date || null,
      createdBy
    );

    return Result.ok(lesson);
  }

  addMaterial(material: Material): Result<void> {
    // Basic validation could go here
    this._materials.push(material);
    return Result.ok(undefined);
  }

  get classId() { return this._classId; }
  get title() { return this._title; }
  get materials() { return this._materials; }
  get createdBy() { return this._createdBy; }
}
