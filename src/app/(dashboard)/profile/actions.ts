'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn'),
  phone: z.string().optional(),
});

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const rawData = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || undefined,
  };

  const parsed = UpdateProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Thông tin không hợp lệ' };
  }

  const { fullName, phone } = parsed.data;
  const { data: existingProfile } = await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle();

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  // Update profiles table
  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      phone: phone,
      ...(existingProfile?.phone !== phone ? { phone_verified_at: null } : {})
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true, message: 'Cập nhật thông tin thành công!' };
}

export async function updatePayOS(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const clientId = formData.get('clientId') as string;
  const apiKey = formData.get('apiKey') as string;
  const checksumKey = formData.get('checksumKey') as string;

  const { error } = await supabase
    .from('profiles')
    .update({ 
      payos_client_id: clientId || null,
      payos_api_key: apiKey || null,
      payos_checksum_key: checksumKey || null
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Lưu cấu hình PayOS thành công!' };
}

const BankAccountSchema = z.object({
  bankName: z.string().min(1, 'Vui lòng nhập tên ngân hàng'),
  accountNumber: z.string().min(1, 'Vui lòng nhập số tài khoản'),
  accountName: z.string().min(1, 'Vui lòng nhập tên chủ tài khoản'),
});

function normalizeVietnamPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84')) return `+${digits}`;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  return `+${digits}`;
}

export async function requestBankPhoneOtp() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Vui lòng đăng nhập lại.' };
  const { data: profile, error } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
  if (error || !profile?.phone) return { error: 'Hãy cập nhật số điện thoại trong Hồ sơ trước.' };
  const phone = normalizeVietnamPhone(profile.phone);
  const { error: otpError } = await supabase.auth.updateUser({ phone });
  if (otpError) return { error: otpError.message };
  return { success: true, phone };
}

export async function verifyBankPhoneOtp(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Vui lòng đăng nhập lại.' };
  const { data: profile, error } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
  if (error || !profile?.phone) return { error: 'Không tìm thấy số điện thoại.' };
  const { error: verifyError } = await supabase.auth.verifyOtp({ phone: normalizeVietnamPhone(profile.phone), token: token.trim(), type: 'phone_change' });
  if (verifyError) return { error: 'Mã OTP không đúng hoặc đã hết hạn.' };
  const { error: updateError } = await supabase.from('profiles').update({ phone_verified_at: new Date().toISOString() }).eq('id', user.id);
  if (updateError) return { error: updateError.message };
  revalidatePath('/profile');
  return { success: true };
}

export async function addBankAccount(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('phone, phone_verified_at').eq('id', user.id).single();
  if (profileError || !profile?.phone_verified_at) {
    return { error: 'Vui lòng xác thực OTP số điện thoại trước khi thêm tài khoản ngân hàng.' };
  }

  const rawData = {
    bankName: formData.get('bankName'),
    accountNumber: formData.get('accountNumber'),
    accountName: formData.get('accountName'),
  };

  const parsed = BankAccountSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Vui lòng điền đầy đủ thông tin' };
  }

  // Check if it's the first account
  const { count } = await supabase
    .from('bank_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const isDefault = count === 0;

  const { error } = await supabase
    .from('bank_accounts')
    .insert({
      user_id: user.id,
      bank_name: parsed.data.bankName,
      account_number: parsed.data.accountNumber,
      account_name: parsed.data.accountName,
      is_default: isDefault
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Đã thêm tài khoản ngân hàng!' };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

export async function setDefaultBankAccount(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // 1. Unset current default
  await supabase
    .from('bank_accounts')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // 2. Set new default
  const { error } = await supabase
    .from('bank_accounts')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

export async function changePassword(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: 'Unauthorized' };

  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return { error: 'Vui lòng nhập đầy đủ thông tin' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp' };
  }

  if (newPassword.length < 6) {
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }

  // 1. Verify old password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (signInError) {
    return { error: 'Mật khẩu cũ không chính xác' };
  }

  // 2. Change password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, message: 'Đổi mật khẩu thành công!' };
}
