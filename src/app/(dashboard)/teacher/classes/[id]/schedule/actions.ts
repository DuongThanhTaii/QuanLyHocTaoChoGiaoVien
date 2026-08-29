'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ScheduleSlot } from '@/domains/schedule/entities/schedule-slot';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addScheduleSlot(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const classId = formData.get('classId') as string;
  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;

  if (!classId || isNaN(dayOfWeek) || !startTime || !endTime) {
    return { error: 'Missing required fields' };
  }

  const repos = await getRepositories();

  // Verify class owner
  const classroom = await repos.classes.findById(classId);
  if (!classroom || classroom.teacherId !== user.id) {
    return { error: 'Forbidden' };
  }

  const slotResult = ScheduleSlot.createRecurring(
    classId,
    dayOfWeek,
    startTime.substring(0, 5),
    endTime.substring(0, 5)
  );

  if (!slotResult.isSuccess()) {
    return { error: slotResult.getError().message };
  }

  try {
    await repos.schedules.save(slotResult.getValue());
    revalidatePath(`/teacher/classes/${classId}/schedule`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteScheduleSlot(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const classId = formData.get('classId') as string;
  const slotId = formData.get('slotId') as string;

  if (!classId || !slotId) return { error: 'Missing required fields' };

  const repos = await getRepositories();

  // Verify class owner
  const classroom = await repos.classes.findById(classId);
  if (!classroom || classroom.teacherId !== user.id) {
    return { error: 'Forbidden' };
  }

  try {
    await repos.schedules.delete(slotId);

    revalidatePath(`/teacher/classes/${classId}/schedule`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
