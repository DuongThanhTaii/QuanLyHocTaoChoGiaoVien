import type { SupabaseClient } from '@supabase/supabase-js';

type ResolveStudentInput = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
  userId?: string | null;
  preferredStudentId?: string | null;
};

/**
 * Resolves the only student record that may represent a logged-in account.
 * The account link is always stronger than a matching contact email.
 */
export async function resolveCanonicalStudent(admin: SupabaseClient, input: ResolveStudentInput) {
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  let profile: { id: string; email: string | null; full_name: string | null; phone: string | null } | null = null;

  if (input.userId) {
    const { data, error } = await admin.from('profiles').select('id, email, full_name, phone').eq('id', input.userId).maybeSingle();
    if (error) throw new Error(error.message);
    profile = data;
  } else if (email) {
    const { data, error } = await admin.from('profiles').select('id, email, full_name, phone').eq('email', email).limit(2);
    if (error) throw new Error(error.message);
    if ((data || []).length > 1) throw new Error('Có nhiều tài khoản dùng cùng email. Vui lòng liên hệ quản trị viên.');
    profile = data?.[0] || null;
  }

  const userId = input.userId || profile?.id || null;
  if (userId) {
    const { data: linked, error } = await admin.from('students').select('*').eq('user_id', userId).limit(2);
    if (error) throw new Error(error.message);
    if ((linked || []).length > 1) throw new Error('Tài khoản này đang liên kết nhiều hồ sơ học sinh. Cần gộp dữ liệu trước khi tiếp tục.');
    if (linked?.[0]) return linked[0];
  }

  if (input.preferredStudentId) {
    const { data: claimed, error } = await admin.from('students').select('*').eq('id', input.preferredStudentId).is('user_id', null).maybeSingle();
    if (error) throw new Error(error.message);
    if (claimed) {
      const { data: linked, error: updateError } = await admin.from('students').update({ user_id: userId }).eq('id', claimed.id).select().single();
      if (updateError || !linked) throw new Error(updateError?.message || 'Không thể liên kết hồ sơ học sinh');
      return linked;
    }
  }

  if (email) {
    const { data: candidates, error } = await admin.from('students').select('*').eq('email', email).is('user_id', null).limit(2);
    if (error) throw new Error(error.message);
    if ((candidates || []).length > 1) throw new Error('Email này có nhiều hồ sơ học sinh chưa liên kết. Cần gộp dữ liệu trước khi thêm vào lớp.');
    if (candidates?.[0]) {
      const { data: linked, error: updateError } = await admin.from('students').update({
        user_id: userId,
        full_name: profile?.full_name || input.fullName || candidates[0].full_name,
        phone: profile?.phone || phone || candidates[0].phone,
      }).eq('id', candidates[0].id).select().single();
      if (updateError || !linked) throw new Error(updateError?.message || 'Không thể liên kết hồ sơ học sinh');
      return linked;
    }
  }

  const { data: created, error: createError } = await admin.from('students').insert({
    user_id: userId,
    full_name: profile?.full_name || input.fullName || email || phone || 'Học sinh',
    email: profile?.email?.toLowerCase() || email,
    phone: profile?.phone || phone,
  }).select().single();
  if (createError || !created) throw new Error(createError?.message || 'Không thể tạo hồ sơ học sinh');
  return created;
}
