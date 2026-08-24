'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { Enrollment } from '@/domains/classroom/entities/enrollment';
import { Money } from '@/domains/shared/value-objects';

const EnrollStudentSchema = z.object({
  classId: z.string().uuid(),
  email: z.string().email(),
  customFee: z.coerce.number().optional()
});

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    classId: formData.get('classId'),
    email: formData.get('email'),
    customFee: formData.get('customFee')
  };

  const parsed = EnrollStudentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const { classId, email, customFee } = parsed.data;

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    return { error: 'Student not found with this email' };
  }

  if (profile.role !== 'student') {
    return { error: 'User is not a student' };
  }

  const repos = await getRepositories();
  
  const existingEnrollments = await repos.enrollments.findByClassId(classId);
  const alreadyEnrolled = existingEnrollments.some(e => e.studentId === profile.id && e.isActive);
  
  if (alreadyEnrolled) {
    return { error: 'Student is already enrolled in this class' };
  }

  const customFeeMoney = customFee ? new Money(customFee) : undefined;
  const enrollmentResult = Enrollment.create(classId, profile.id, customFeeMoney);

  if (!enrollmentResult.isSuccess()) {
    return { error: enrollmentResult.getError().message };
  }

  await repos.enrollments.save(enrollmentResult.getValue());

  revalidatePath(`/teacher/classes/${classId}/students`);
  return { success: true };
}
