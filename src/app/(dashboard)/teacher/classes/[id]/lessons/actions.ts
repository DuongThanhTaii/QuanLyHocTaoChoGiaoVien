'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ContentService } from '@/application/services/content.service';
import { randomUUID } from 'crypto';

const CreateLessonSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional()
});

export async function createLessonAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    classId: formData.get('classId'),
    title: formData.get('title'),
    content: formData.get('content')
  };

  const parsed = CreateLessonSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const repos = await getRepositories();
  const contentService = new ContentService(repos.content);
  
  const result = await contentService.createLesson(
    parsed.data.classId,
    parsed.data.title,
    user.id,
    parsed.data.content
  );

  if (result.isSuccess()) {
    revalidatePath(`/teacher/classes/${parsed.data.classId}/lessons`);
    return { success: true };
  }

  return { error: result.getError().message };
}

const AttachMaterialSchema = z.object({
  lessonId: z.string().uuid(),
  classId: z.string().uuid(),
  materialName: z.string().min(1),
  materialPath: z.string().min(1),
  fileType: z.string(),
  sizeBytes: z.coerce.number()
});

export async function attachMaterialAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    lessonId: formData.get('lessonId'),
    classId: formData.get('classId'),
    materialName: formData.get('materialName'),
    materialPath: formData.get('materialPath'),
    fileType: formData.get('fileType'),
    sizeBytes: formData.get('sizeBytes')
  };

  const parsed = AttachMaterialSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const repos = await getRepositories();
  const contentService = new ContentService(repos.content);
  
  const result = await contentService.attachMaterialToLesson(
    parsed.data.lessonId,
    {
      id: randomUUID(),
      name: parsed.data.materialName,
      storagePath: parsed.data.materialPath,
      fileType: parsed.data.fileType,
      sizeBytes: parsed.data.sizeBytes,
      uploadedBy: user.id
    }
  );

  if (result.isSuccess()) {
    revalidatePath(`/teacher/classes/${parsed.data.classId}/lessons`);
    return { success: true };
  }

  return { error: result.getError().message };
}
