import { Lesson, Material } from '../../domains/content/entities/lesson';
import { Exercise } from '../../domains/content/entities/exercise';

export interface IContentRepository {
  findLessonById(id: string): Promise<Lesson | null>;
  findLessonsByClass(classId: string): Promise<Lesson[]>;
  saveLesson(lesson: Lesson): Promise<void>;
  
  findExerciseById(id: string): Promise<Exercise | null>;
  findExercisesByClass(classId: string): Promise<Exercise[]>;
  saveExercise(exercise: Exercise): Promise<void>;
}
