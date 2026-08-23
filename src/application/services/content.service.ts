import { IContentRepository } from '../ports/content.repository';
import { Lesson, Material } from '../../domains/content/entities/lesson';
import { Exercise } from '../../domains/content/entities/exercise';
import { Result } from '../../domains/shared/result';

export class ContentService {
  constructor(private contentRepo: IContentRepository) {}

  async createLesson(
    classId: string, 
    title: string, 
    teacherId: string, 
    content?: string
  ): Promise<Result<Lesson>> {
    const lessonResult = Lesson.create(classId, title, teacherId, content);
    if (!lessonResult.isSuccess()) {
      return lessonResult;
    }

    await this.contentRepo.saveLesson(lessonResult.getValue());
    return lessonResult;
  }

  async attachMaterialToLesson(
    lessonId: string,
    materialProps: { id: string, name: string, storagePath: string, fileType: string, sizeBytes: number, uploadedBy: string }
  ): Promise<Result<void>> {
    const lesson = await this.contentRepo.findLessonById(lessonId);
    if (!lesson) return Result.fail(new Error("Lesson not found"));

    const material = new Material(
      materialProps.id,
      materialProps.name,
      materialProps.storagePath,
      materialProps.fileType,
      materialProps.sizeBytes,
      materialProps.uploadedBy
    );

    lesson.addMaterial(material);
    await this.contentRepo.saveLesson(lesson);
    return Result.ok(undefined);
  }

  async createExercise(
    classId: string,
    title: string,
    description?: string,
    dueDate?: Date
  ): Promise<Result<Exercise>> {
    const exerciseResult = Exercise.create(classId, title, undefined, description, dueDate);
    if (!exerciseResult.isSuccess()) return exerciseResult;

    await this.contentRepo.saveExercise(exerciseResult.getValue());
    return exerciseResult;
  }
}
