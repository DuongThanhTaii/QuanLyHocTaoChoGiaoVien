'use server';

import { createClient } from '@/infrastructure/auth/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendLinkRequest(studentEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Dùng admin client để bypass RLS (vì parent không có quyền đọc profile của người khác chưa liên kết)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: studentProfile, error: studentError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', studentEmail)
    .single();

  if (studentError || !studentProfile) {
    return { error: 'Học sinh chưa có tài khoản' };
  }

  // Ensure they are actually a student (optional check)
  if (studentProfile.role !== 'student') {
    return { error: 'Email này không phải là tài khoản học sinh' };
  }

  const { error: insertError } = await supabase
    .from('guardian_student_requests')
    .insert({
      parent_id: user.id,
      student_email: studentEmail,
      student_id: studentProfile.id,
      status: 'PENDING'
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'Yêu cầu liên kết đã tồn tại' };
    }
    return { error: insertError.message };
  }

  revalidatePath('/parent/students');
  return { success: true };
}

export async function respondToLinkRequest(requestId: string, accept: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify request
  const { data: request, error: reqError } = await supabase
    .from('guardian_student_requests')
    .select('*')
    .eq('id', requestId)
    .eq('student_id', user.id)
    .single();

  if (reqError || !request) return { error: 'Không tìm thấy yêu cầu' };
  if (request.status !== 'PENDING') return { error: 'Yêu cầu này đã được xử lý' };

  const newStatus = accept ? 'ACCEPTED' : 'REJECTED';

  const { error: updateError } = await supabase
    .from('guardian_student_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (updateError) return { error: updateError.message };

  if (accept) {
    // Find or create student
    let { data: studentEntity } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!studentEntity) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: newStudent } = await supabase
        .from('students')
        .insert({ user_id: user.id, full_name: profile?.full_name || 'Unknown', email: profile?.email })
        .select('id')
        .single();
      studentEntity = newStudent;
    }

    // Find or create guardian
    let { data: guardianEntity } = await supabase
      .from('guardians')
      .select('id')
      .eq('user_id', request.parent_id)
      .single();

    if (!guardianEntity) {
      const { data: parentProfile } = await supabase.from('profiles').select('*').eq('id', request.parent_id).single();
      const { data: newGuardian } = await supabase
        .from('guardians')
        .insert({ user_id: request.parent_id, full_name: parentProfile?.full_name || 'Unknown', email: parentProfile?.email })
        .select('id')
        .single();
      guardianEntity = newGuardian;
    }

    // Insert into student_guardians
    if (studentEntity && guardianEntity) {
      const { error: linkError } = await supabase
        .from('student_guardians')
        .upsert({
          student_id: studentEntity.id,
          guardian_id: guardianEntity.id,
          relationship: 'GUARDIAN'
        });
      if (linkError) console.error('Error linking:', linkError);
    }
  }

  revalidatePath('/student/requests');
  return { success: true };
}
