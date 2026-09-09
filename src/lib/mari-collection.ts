import type { SupabaseClient } from '@supabase/supabase-js';

type CollectionAccount = { id: string; bank_name: string; account_number: string; account_name: string };

export async function getMariCollectionSnapshot(admin: SupabaseClient, teacherId: string) {
  const { data: setting } = await admin.from('teacher_tuition_collection_settings')
    .select('collection_mode, payout_bank_account_id').eq('teacher_id', teacherId).maybeSingle();
  if (setting?.collection_mode !== 'mari_auto') return null;
  const { data: account } = await admin.from('platform_collection_accounts')
    .select('id, bank_name, account_number, account_name').eq('is_active', true).maybeSingle();
  if (!account) return null;
  return account as CollectionAccount;
}

export async function applyInvoiceCollectionSnapshot(admin: SupabaseClient, teacherId: string, invoiceIds: string[]) {
  if (!invoiceIds.length) return;
  const account = await getMariCollectionSnapshot(admin, teacherId);
  if (!account) return;
  await admin.from('invoices').update({
    collection_mode: 'mari_auto',
    collection_account_snapshot: { bankName: account.bank_name, accountNumber: account.account_number, accountName: account.account_name, accountId: account.id },
  }).in('id', invoiceIds).eq('teacher_id', teacherId);
}

export function vietnamCutoff(date = new Date()) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  local.setHours(17, 0, 0, 0);
  return local;
}
