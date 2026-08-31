'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { NotificationService } from '@/application/services/notification.service';

const SaveEvaluationSchema = z.object({
  classId: z.string().uuid(),
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  rating: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']),
  feedback: z.string().optional()
});

export async function saveSessionEvaluation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Bạn không có quyền thực hiện thao tác này.' };
  }

  const rawData = {
    classId: formData.get('classId'),
    sessionId: formData.get('sessionId'),
    studentId: formData.get('studentId'),
    rating: formData.get('rating'),
    feedback: formData.get('feedback')
  };

  const parsed = SaveEvaluationSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Dữ liệu đánh giá chưa hợp lệ.' };
  }

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const supabaseAdmin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Lưu hoặc cập nhật vào bảng session_evaluations
  const { error: upsertError } = await supabaseAdmin
    .from('session_evaluations')
    .upsert({
      class_id: parsed.data.classId,
      session_id: parsed.data.sessionId,
      student_id: parsed.data.studentId,
      rating: parsed.data.rating,
      feedback: parsed.data.feedback?.trim() || null,
      marked_by: user.id,
      marked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'session_id,student_id'
    });

  if (upsertError) {
    console.error('Error saving session evaluation:', upsertError);
    return { error: upsertError.message || 'Lỗi khi lưu đánh giá' };
  }

  // 2. Gửi thông báo đến phụ huynh và học sinh
  try {
    const notificationService = new NotificationService(supabaseAdmin);
    
    // Lấy thông tin học sinh và lớp
    const { data: student } = await supabaseAdmin.from('students').select('full_name').eq('id', parsed.data.studentId).single();
    const { data: classInfo } = await supabaseAdmin.from('classes').select('name').eq('id', parsed.data.classId).single();
    
    // Lấy danh sách phụ huynh của học sinh
    const { SupabaseGuardianRepository } = await import('@/infrastructure/persistence/supabase/repositories/guardian.repository');
    const guardianRepository = new SupabaseGuardianRepository(supabaseAdmin);
    const guardians = await guardianRepository.getGuardiansForStudent(parsed.data.studentId);
    
    const ratingMap: Record<string, string> = {
      EXCELLENT: 'Xuất sắc 🌟',
      GOOD: 'Tốt 🟢',
      AVERAGE: 'Cần cố gắng 🟡',
      POOR: 'Chưa tập trung 🔴'
    };
    const ratingText = ratingMap[parsed.data.rating] || parsed.data.rating;
    const studentName = student?.full_name || 'Học sinh';
    const className = classInfo?.name || 'Lớp học';
    const dateStr = new Date().toLocaleDateString('vi-VN');
    
    const title = `Đánh giá buổi học: ${studentName}`;
    const feedbackSnippet = parsed.data.feedback?.trim() ? ` Lời dặn dò: "${parsed.data.feedback.trim()}"` : '';
    const content = `Học sinh ${studentName} được giáo viên đánh giá: ${ratingText} trong buổi học lớp ${className} ngày ${dateStr}.${feedbackSnippet}`;

    for (const g of guardians) {
      if (g.guardians?.user_id) {
        await notificationService.notifyUser(
          g.guardians.user_id,
          g.guardians.email,
          title,
          content,
          'evaluation',
          { classId: parsed.data.classId, studentId: parsed.data.studentId, sessionId: parsed.data.sessionId }
        );
      }
    }
  } catch (notifyErr) {
    console.error('Failed to send evaluation notification:', notifyErr);
  }

  revalidatePath(`/teacher/classes/${parsed.data.classId}/evaluations`);
  revalidatePath(`/parent/students/${parsed.data.studentId}`);
  revalidatePath(`/student/classes/${parsed.data.classId}/evaluations`);

  return { success: true };
}
