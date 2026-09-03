'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { AttendanceService } from '@/application/services/attendance.service';
import { AttendanceStatus } from '@/domains/attendance/entities/attendance-record';
import { NotificationService } from '@/application/services/notification.service';

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

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { SupabaseAttendanceRepository } = await import('@/infrastructure/persistence/supabase/repositories/attendance.repository');
  const attendanceRepository = new SupabaseAttendanceRepository(supabaseAdmin);
  const attendanceService = new AttendanceService(attendanceRepository);
  
  const result = await attendanceService.markAttendance(
    parsed.data.slotId,
    parsed.data.studentId,
    parsed.data.classId,
    parsed.data.status as AttendanceStatus,
    user.id,
    parsed.data.note
  );

  if (result.isSuccess()) {
    // ---- KÍCH HOẠT THÔNG BÁO ----
    const { createClient: createAdmin } = require('@supabase/supabase-js');
    const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const notificationService = new NotificationService(supabaseAdmin);
    
    // 1. Lấy tên học sinh và lớp
    const { data: student } = await supabaseAdmin.from('students').select('full_name').eq('id', parsed.data.studentId).single();
    const { data: classInfo } = await supabaseAdmin.from('classes').select('name').eq('id', parsed.data.classId).single();
    
    // 2. Lấy danh sách phụ huynh của học sinh này bằng admin client để bypass RLS
    const { SupabaseGuardianRepository } = await import('@/infrastructure/persistence/supabase/repositories/guardian.repository');
    const guardianRepository = new SupabaseGuardianRepository(supabaseAdmin);
    const guardians = await guardianRepository.getGuardiansForStudent(parsed.data.studentId);
    
    // 3. Chuẩn bị nội dung thông báo
    const statusMap: Record<string, string> = {
      'present': 'Có mặt',
      'absent': 'Vắng mặt',
      'late': 'Đi trễ',
      'excused': 'Có phép'
    };
    const statusText = statusMap[parsed.data.status];
    const studentName = student?.full_name || 'Học sinh';
    const className = classInfo?.name || 'Lớp học';
    const dateStr = new Date().toLocaleDateString('vi-VN');
    
    const title = `Thông báo điểm danh: ${studentName}`;
    const content = `Học sinh ${studentName} đã được điểm danh: ${statusText} trong buổi học lớp ${className} ngày ${dateStr}. ${parsed.data.note ? `(Ghi chú: ${parsed.data.note})` : ''}`;

    // 4. Gửi thông báo cho từng phụ huynh
    for (const g of guardians) {
      if (g.guardians?.user_id) {
        await notificationService.notifyUser(
          g.guardians.user_id,
          g.guardians.email,
          title,
          content,
          'attendance',
          { classId: parsed.data.classId, studentId: parsed.data.studentId, slotId: parsed.data.slotId }
        );
      }
    }
    // ----------------------------

    revalidatePath(`/teacher/classes/${parsed.data.classId}/attendance`);
    return { success: true };
  }

  return { error: result.getError().message };
}

const CreateMakeupSessionSchema = z.object({
  classId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
  note: z.string().optional()
});

export async function createMakeupSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    classId: formData.get('classId'),
    date: formData.get('date'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    note: formData.get('note')
  };

  const parsed = CreateMakeupSessionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Invalid data' };
  }

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Format times properly for DB
  const startObj = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const endObj = new Date(`${parsed.data.date}T${parsed.data.endTime}:00`);
  
  const { data: session, error } = await supabaseAdmin
    .from('class_sessions')
    .insert({
      class_id: parsed.data.classId,
      schedule_slot_id: null,
      title: 'Buổi học bù / Phát sinh' + (parsed.data.note ? ` - ${parsed.data.note}` : ''),
      session_date: parsed.data.date,
      start_time: `${parsed.data.startTime}:00`,
      end_time: `${parsed.data.endTime}:00`,
      status: 'SCHEDULED'
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/teacher/classes/${parsed.data.classId}/attendance`);
  revalidatePath(`/teacher/classes/${parsed.data.classId}/evaluations`);
  return { success: true, sessionId: session.id };
}
