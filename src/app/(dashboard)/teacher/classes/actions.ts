'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ClassService } from '@/application/services/class.service';
import { Money } from '@/domains/shared/value-objects';

const CreateClassSchema = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  feePerSession: z.coerce.number().min(0),
  color: z.string().optional()
});

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    name: formData.get('name'),
    subject: formData.get('subject'),
    feePerSession: formData.get('feePerSession'),
    color: formData.get('color')
  };

  const parsed = CreateClassSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const repos = await getRepositories();
  const classService = new ClassService(repos.classes, repos.enrollments);
  
  const result = await classService.createClass({
    teacherId: user.id,
    name: parsed.data.name,
    subject: parsed.data.subject,
    feePerSession: new Money(parsed.data.feePerSession),
    feeType: 'per_session' as const,
    color: parsed.data.color,
    isActive: true
  });

  if (result.isSuccess()) {
    revalidatePath('/teacher/classes');
    redirect('/teacher/classes');
  }

  return { error: result.getError().message };
}
