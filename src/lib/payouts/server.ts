import type { SupabaseClient } from '@supabase/supabase-js';

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

export function vietnamBatchDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: VIETNAM_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const read = (name: string) => parts.find((part) => part.type === name)?.value;
  return `${read('year')}-${read('month')}-${read('day')}`;
}

export function cutoffForBatchDate(batchDate: string) {
  return new Date(`${batchDate}T17:00:00+07:00`).toISOString();
}

/** Creates one immutable draft per Vietnam day. The unique payable link prevents double batching. */
export async function createDailyPayoutDraft(admin: SupabaseClient, actorId: string | null, now = new Date()) {
  const batchDate = vietnamBatchDate(now);
  const cutoffAt = cutoffForBatchDate(batchDate);
  const { data: existing, error: existingError } = await admin.from('payout_batches').select('*').eq('batch_date', batchDate).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data: batch, error: batchError } = await admin.from('payout_batches')
    .insert({ batch_date: batchDate, cutoff_at: cutoffAt, created_by: actorId }).select('*').single();
  if (batchError) {
    const { data: raced } = await admin.from('payout_batches').select('*').eq('batch_date', batchDate).maybeSingle();
    if (raced) return raced;
    throw new Error(batchError.message);
  }

  const { data: payables, error: payableError } = await admin.from('teacher_payables').select('*')
    .eq('status', 'available').lte('available_at', cutoffAt);
  if (payableError) throw new Error(payableError.message);

  const byTeacher = new Map<string, any[]>();
  for (const payable of payables ?? []) byTeacher.set(payable.teacher_id, [...(byTeacher.get(payable.teacher_id) ?? []), payable]);
  let total = 0; let itemCount = 0;
  for (const [teacherId, teacherPayables] of byTeacher) {
    const { data: setting } = await admin.from('teacher_tuition_collection_settings').select('payout_bank_account_id').eq('teacher_id', teacherId).maybeSingle();
    if (!setting?.payout_bank_account_id) continue;
    const { data: account } = await admin.from('bank_accounts').select('bank_name, account_number, account_name').eq('id', setting.payout_bank_account_id).eq('teacher_id', teacherId).maybeSingle();
    if (!account) continue;
    const amount = teacherPayables.reduce((sum, payable) => sum + Number(payable.net_amount), 0);
    const { data: item, error: itemError } = await admin.from('payout_items').insert({ batch_id: batch.id, teacher_id: teacherId, amount, bank_name_snapshot: account.bank_name, account_number_snapshot: account.account_number, account_name_snapshot: account.account_name }).select('id').single();
    if (itemError) throw new Error(itemError.message);
    const { error: linkError } = await admin.from('payout_item_payables').insert(teacherPayables.map((payable) => ({ payout_item_id: item.id, payable_id: payable.id })));
    if (linkError) { await admin.from('payout_items').update({ status: 'adjustment_required', failure_reason: 'Không thể khóa khoản phải trả' }).eq('id', item.id); continue; }
    const { error: updateError } = await admin.from('teacher_payables').update({ status: 'batched' }).in('id', teacherPayables.map((payable) => payable.id)).eq('status', 'available');
    if (updateError) throw new Error(updateError.message);
    total += amount; itemCount += 1;
  }
  await admin.from('payout_batches').update({ total_amount: total, item_count: itemCount }).eq('id', batch.id);
  return { ...batch, total_amount: total, item_count: itemCount };
}
