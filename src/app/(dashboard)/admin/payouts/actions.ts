'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPermission, writeAdminAuditLog } from '@/lib/admin/server';
import { createDailyPayoutDraft } from '@/lib/payouts/server';
import { encryptCassoSecret } from '@/lib/casso/server';

export async function createPayoutDraftAction() {
  const { user, admin } = await requireAdminPermission('billing.manage');
  const batch = await createDailyPayoutDraft(admin, user.id);
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'payout_batch.create_draft', resourceType: 'payout_batch', resourceId: batch.id });
  revalidatePath('/admin/payouts'); return batch;
}

export async function savePlatformCollectionAccountAction(formData: FormData) {
  const bankName = String(formData.get('bankName') ?? '').trim(); const accountNumber = String(formData.get('accountNumber') ?? '').replace(/\s/g, ''); const accountName = String(formData.get('accountName') ?? '').trim();
  if (!bankName || !accountNumber || !accountName) throw new Error('Cần nhập đủ ngân hàng, số tài khoản và chủ tài khoản Mari.');
  const { user, admin } = await requireAdminPermission('billing.manage');
  await admin.from('platform_collection_accounts').update({ is_active: false }).eq('is_active', true);
  const { error } = await admin.from('platform_collection_accounts').insert({ bank_name: bankName, account_number: accountNumber, account_name: accountName, is_active: true, created_by: user.id });
  if (error) throw new Error(error.message);
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'mari_collection_account.configure', resourceType: 'platform_collection_account' });
  revalidatePath('/admin/payouts'); revalidatePath('/profile');
}

export async function savePlatformCassoWebhookAction(formData: FormData) {
  const webhookSecret = String(formData.get('webhookSecret') ?? '').trim();
  if (!webhookSecret) throw new Error('Cần nhập webhook secret do Casso cấp.');
  const { user, admin } = await requireAdminPermission('billing.manage');
  const { data: account } = await admin.from('platform_collection_accounts').select('id').eq('is_active', true).maybeSingle();
  if (!account) throw new Error('Hãy lưu STK Mari thu hộ trước.');
  await admin.from('platform_casso_connections').update({ status: 'revoked' }).eq('status', 'active');
  const encrypted = encryptCassoSecret(webhookSecret);
  const { error } = await admin.from('platform_casso_connections').insert({ collection_account_id: account.id, access_token_encrypted: encrypted, webhook_secret_encrypted: encrypted, status: 'active' });
  if (error) throw new Error(error.message);
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'mari_casso.configure_webhook', resourceType: 'platform_casso_connection' });
  revalidatePath('/admin/payouts');
}

export async function approvePayoutBatchAction(batchId: string) {
  const { user, admin } = await requireAdminPermission('billing.manage');
  const { error } = await admin.from('payout_batches').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', batchId).eq('status', 'draft');
  if (error) throw new Error(error.message);
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'payout_batch.approve', resourceType: 'payout_batch', resourceId: batchId });
  revalidatePath('/admin/payouts');
}

export async function markPayoutItemPaidAction(itemId: string, bankReference: string) {
  if (!bankReference.trim()) throw new Error('Bắt buộc nhập mã giao dịch ngân hàng.');
  const { user, admin } = await requireAdminPermission('billing.manage');
  const { data: item } = await admin.from('payout_items').select('id, batch_id, payout_batches(status)').eq('id', itemId).single();
  if (!item) throw new Error('Không tìm thấy dòng chi.');
  const batchStatus = (item.payout_batches as { status?: string } | null)?.status;
  if (!['exported', 'processing'].includes(batchStatus ?? '')) throw new Error('Cần duyệt và xuất bảng kê trước khi xác nhận chi.');
  const { data: evidence } = await admin.from('payout_evidence').select('id').eq('batch_id', item.batch_id).in('evidence_type', ['bank_receipt', 'bank_statement']).or(`payout_item_id.eq.${itemId},payout_item_id.is.null`).limit(1);
  if (!evidence?.length) throw new Error('Cần tải biên lai hoặc sao kê ngân hàng trước khi chốt đã chi.');
  const now = new Date().toISOString();
  const { error } = await admin.from('payout_items').update({ status: 'paid', bank_transaction_reference: bankReference.trim(), processed_by: user.id, processed_at: now }).eq('id', itemId).eq('status', 'pending');
  if (error) throw new Error(error.message);
  const { data: links } = await admin.from('payout_item_payables').select('payable_id').eq('payout_item_id', itemId);
  await admin.from('teacher_payables').update({ status: 'paid', paid_at: now }).in('id', (links ?? []).map((link) => link.payable_id));
  await writeAdminAuditLog(admin, { actorId: user.id, action: 'payout_item.mark_paid', resourceType: 'payout_item', resourceId: itemId });
  revalidatePath('/admin/payouts');
}
