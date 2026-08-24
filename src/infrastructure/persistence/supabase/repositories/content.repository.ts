import { SupabaseClient } from '@supabase/supabase-js';
import { Lesson, Material } from '../../../../domains/content/entities/lesson';
import { Exercise } from '../../../../domains/content/entities/exercise';
import { IContentRepository } from '../../../../application/ports/content.repository';

export class SupabaseContentRepository implements IContentRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toLessonDomain(row: any): Lesson {
    const lesson = Object.create(Lesson.prototype);
    Object.assign(lesson, {
      _id: row.id,
      _classId: row.class_id,
      _title: row.title,
      _content: row.content,
      _weekNumber: row.week_number,
      _date: row.date ? new Date(row.date) : null,
      _createdBy: row.created_by,
      _materials: row.materials ? row.materials.map((m: any) => this.toMaterialDomain(m)) : []
    });
    return lesson;
  }

  private toMaterialDomain(row: any): Material {
    // Assuming Material is a simple object or has a constructor we can bypass
    const material = Object.create(Material.prototype || Object.prototype);
    return Object.assign(material, {
      id: row.id,
      name: row.name,
      storagePath: row.storage_path,
      fileType: row.file_type,
      sizeBytes: row.size_bytes,
      uploadedBy: row.uploaded_by
    });
  }

  private toExerciseDomain(row: any): Exercise {
    const exercise = Object.create(Exercise.prototype);
    Object.assign(exercise, {
      _id: row.id,
      _lessonId: row.lesson_id,
      _classId: row.class_id,
      _title: row.title,
      _description: row.description,
      _dueDate: row.due_date ? new Date(row.due_date) : null,
      _maxScore: row.max_score,
      _attachments: row.attachments || []
    });
    return exercise;
  }

  async findLessonById(id: string): Promise<Lesson | null> {
    const { data, error } = await this.client
      .from('lessons')
      .select('*, materials(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find lesson: ${error.message}`);
    }
    
    return this.toLessonDomain(data);
  }

  async findLessonsByClass(classId: string): Promise<Lesson[]> {
    const { data, error } = await this.client
      .from('lessons')
      .select('*, materials(*)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find lessons: ${error.message}`);
    }

    return data.map(row => this.toLessonDomain(row));
  }

  async saveLesson(lesson: Lesson): Promise<void> {
    const anyLesson = lesson as any;
    const lessonId = anyLesson.id || anyLesson._id;
    
    const { error: lessonError } = await this.client
      .from('lessons')
      .upsert({
        id: lessonId,
        class_id: anyLesson.classId || anyLesson._classId,
        title: anyLesson.title || anyLesson._title,
        content: anyLesson.content || anyLesson._content,
        week_number: anyLesson.weekNumber || anyLesson._weekNumber,
        date: (anyLesson.date || anyLesson._date) ? new Date(anyLesson.date || anyLesson._date).toISOString() : null,
        created_by: anyLesson.createdBy || anyLesson._createdBy,
        updated_at: new Date().toISOString()
      });

    if (lessonError) {
      throw new Error(`Failed to save lesson: ${lessonError.message}`);
    }

    const materials = anyLesson.materials || anyLesson._materials;
    if (materials && materials.length > 0) {
      const materialsToUpsert = materials.map((m: any) => ({
        id: m.id || m._id,
        lesson_id: lessonId,
        class_id: anyLesson.classId || anyLesson._classId,
        name: m.name,
        storage_path: m.storagePath,
        file_type: m.fileType,
        size_bytes: m.sizeBytes,
        uploaded_by: m.uploadedBy
      }));

      const { error: materialsError } = await this.client
        .from('materials')
        .upsert(materialsToUpsert);

      if (materialsError) {
        throw new Error(`Failed to save materials: ${materialsError.message}`);
      }
    }
  }

  async findExerciseById(id: string): Promise<Exercise | null> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find exercise: ${error.message}`);
    }

    return this.toExerciseDomain(data);
  }

  async findExercisesByClass(classId: string): Promise<Exercise[]> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find exercises: ${error.message}`);
    }

    return data.map(row => this.toExerciseDomain(row));
  }

  async saveExercise(exercise: Exercise): Promise<void> {
    const anyEx = exercise as any;
    const { error } = await this.client
      .from('exercises')
      .upsert({
        id: anyEx.id || anyEx._id,
        lesson_id: anyEx.lessonId || anyEx._lessonId,
        class_id: anyEx.classId || anyEx._classId,
        title: anyEx.title || anyEx._title,
        description: anyEx.description || anyEx._description,
        due_date: (anyEx.dueDate || anyEx._dueDate) ? new Date(anyEx.dueDate || anyEx._dueDate).toISOString() : null,
        max_score: anyEx.maxScore || anyEx._maxScore,
        attachments: anyEx.attachments || anyEx._attachments || []
      });

    if (error) {
      throw new Error(`Failed to save exercise: ${error.message}`);
    }
  }
}
