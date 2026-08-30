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

  const repos = await getRepositories();
  const attendanceService = new AttendanceService(repos.attendance);
  
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
    
    // 2. Lấy danh sách phụ huynh của học sinh này
    const guardians = await repos.guardians.getGuardiansForStudent(parsed.data.studentId);
    
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
