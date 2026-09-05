'use server'

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { cassoApi, decryptCassoSecret, normalizeAccountNumber } from '@/lib/casso/server';

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
      phone: phone,
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

type CassoAccount = { id: string | number; accountNumber?: string; accountName?: string; bankName?: string; connectStatus?: number };

async function getCurrentCassoConnection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Vui lòng đăng nhập lại.');
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('is_primary', true).maybeSingle();
  if (role?.role !== 'teacher') throw new Error('Tự động đối soát chỉ dành cho tài khoản giáo viên.');
  const admin = getServiceClient();
  const { data: connection, error } = await admin.from('casso_connections').select('*').eq('teacher_id', user.id).maybeSingle();
  if (error || !connection) throw new Error('Bạn chưa kết nối Casso.');
  return { user, admin, connection };
}

export async function getCassoAccounts() {
  const { connection } = await getCurrentCassoConnection();
  const accounts = await cassoApi<CassoAccount[]>(decryptCassoSecret(connection.access_token_encrypted), '/v2/accounts');
  return accounts.map((account) => ({
    id: String(account.id), accountNumber: account.accountNumber || '', accountName: account.accountName || '', bankName: account.bankName || 'Ngân hàng', connected: account.connectStatus !== 0,
  }));
}

export async function activateCassoReconciliation(bankAccountId: string, cassoAccountId: string) {
  const { user, admin, connection } = await getCurrentCassoConnection();
  const accessToken = decryptCassoSecret(connection.access_token_encrypted);
  const [accounts, bankAccountResult] = await Promise.all([
    cassoApi<CassoAccount[]>(accessToken, '/v2/accounts'),
    admin.from('bank_accounts').select('id, account_number').eq('id', bankAccountId).eq('user_id', user.id).maybeSingle(),
  ]);
  if (!bankAccountResult.data) throw new Error('Tài khoản nhận tiền không hợp lệ.');
  const selected = accounts.find((account) => String(account.id) === cassoAccountId);
  if (!selected || normalizeAccountNumber(selected.accountNumber) !== normalizeAccountNumber(bankAccountResult.data.account_number)) {
    throw new Error('Tài khoản Casso phải trùng với STK nhận học phí đã chọn.');
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://mari.io.vn';
  const webhookSecret = decryptCassoSecret(connection.webhook_secret_encrypted);
  await cassoApi(accessToken, '/v2/webhooks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhook: `${origin}/api/webhooks/casso`, secure_token: webhookSecret, income_only: true }),
  }).catch(() => null);
  const { error } = await admin.from('casso_connections').update({
    casso_bank_account_id: String(selected.id), bank_account_id: bankAccountId, status: 'active', last_error: null, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq('id', connection.id);
  if (error) throw new Error(error.message);
  revalidatePath('/profile');
  return { success: true };
}

export async function disconnectCasso() {
  const { admin, connection } = await getCurrentCassoConnection();
  const { error } = await admin.from('casso_connections').update({ status: 'revoked', casso_bank_account_id: null, bank_account_id: null, updated_at: new Date().toISOString() }).eq('id', connection.id);
  if (error) throw new Error(error.message);
  revalidatePath('/profile');
  return { success: true };
}

export async function getCassoReconciliationQueue() {
  const { user, admin, connection } = await getCurrentCassoConnection();
  const { data, error } = await admin.from('casso_reconciliation_queue')
    .select('id, amount, transfer_content, reason, created_at, invoice:invoices(id, invoice_number, total_amount, status)')
    .eq('connection_id', connection.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(8);
  if (error) throw new Error(error.message);
  return (data ?? []).map((item: any) => ({ ...item, teacherId: user.id, invoice: Array.isArray(item.invoice) ? item.invoice[0] : item.invoice }));
}

export async function resolveCassoReconciliation(queueId: string, accept: boolean) {
  const { user, admin } = await getCurrentCassoConnection();
  const { data: queue, error } = await admin.from('casso_reconciliation_queue')
    .select('id, connection_id, invoice_id, amount, casso_transaction_id, casso_connections!inner(teacher_id)')
    .eq('id', queueId).eq('status', 'pending').maybeSingle();
  const owner = Array.isArray(queue?.casso_connections) ? queue?.casso_connections[0] : queue?.casso_connections;
  if (error || !queue || owner?.teacher_id !== user.id) throw new Error('Giao dịch chờ xác nhận không hợp lệ.');
  if (accept && queue.invoice_id) {
    await admin.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString(), paid_amount: queue.amount, payment_method: 'bank_transfer', payment_reference: `casso:${queue.casso_transaction_id}` }).eq('id', queue.invoice_id).neq('status', 'paid');
    await admin.from('payment_transactions').insert({ invoice_id: queue.invoice_id, amount: queue.amount, method: 'bank_transfer', status: 'paid', gateway_response: { gateway: 'casso', transactionId: queue.casso_transaction_id, manuallyConfirmed: true }, paid_by: user.id });
  }
  const { error: updateError } = await admin.from('casso_reconciliation_queue').update({ status: accept ? 'matched' : 'ignored', resolved_at: new Date().toISOString(), resolved_by: user.id, reason: accept ? 'Giáo viên xác nhận khớp' : 'Giáo viên bỏ qua giao dịch' }).eq('id', queue.id);
  if (updateError) throw new Error(updateError.message);
  revalidatePath('/profile');
  revalidatePath('/teacher/invoices');
  return { success: true };
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
