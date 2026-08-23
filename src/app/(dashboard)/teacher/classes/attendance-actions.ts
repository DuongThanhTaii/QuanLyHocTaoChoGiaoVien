'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
// import { AttendanceService } from '@/application/services/attendance.service';

const MarkAttendanceSchema = z.object({
  slotId: z.string().uuid(),
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  note: z.string().optional()
});

export async function markAttendance(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    slotId: formData.get('slotId'),
    classId: formData.get('classId'),
    studentId: formData.get('studentId'),
    status: formData.get('status'),
    note: formData.get('note')
  };

  const parsed = MarkAttendanceSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  // DI Setup
  // const attendanceService = new AttendanceService(new SupabaseAttendanceRepository(supabase));
  // const result = await attendanceService.markAttendance(
  //   parsed.data.slotId, 
  //   parsed.data.studentId, 
  //   parsed.data.classId, 
  //   parsed.data.status, 
  //   user.id, 
  //   parsed.data.note
  // );

  const result = { isSuccess: () => true, getError: () => new Error('Stub') };

  if (result.isSuccess()) {
    revalidatePath(`/teacher/classes/${parsed.data.classId}/attendance`);
    return { success: true };
  }

  return { error: result.getError().message };
}
