'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { ScheduleSlot } from '@/domains/schedule/entities/schedule-slot';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addScheduleSlot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Ensure user is teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'teacher') {
    throw new Error('Forbidden');
  }

  const classId = formData.get('classId') as string;
  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;

  if (!classId || isNaN(dayOfWeek) || !startTime || !endTime) {
    throw new Error('Missing required fields');
  }

  const repos = await getRepositories();

  const slotResult = ScheduleSlot.createRecurring(
    classId,
    dayOfWeek,
    startTime.substring(0, 5),
    endTime.substring(0, 5)
  );

  if (!slotResult.isSuccess()) {
    return { error: slotResult.getError().message };
  }

  await repos.schedules.save(slotResult.getValue());

  revalidatePath(`/teacher/classes/${classId}/schedule`);
  redirect(`/teacher/classes/${classId}/schedule`);
}
