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

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  // Update profiles table
  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      phone_number: phone
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

export async function addBankAccount(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
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

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function setDefaultBankAccount(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Reset all to false
  await supabase
    .from('bank_accounts')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // Set the specific one to true
  const { error } = await supabase
    .from('bank_accounts')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}
