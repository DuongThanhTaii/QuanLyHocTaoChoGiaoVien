import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { requireAdminPermission } from '@/lib/admin/server';
import { putSubmissionObject } from '@/lib/r2/server';

export async function POST(request: Request) {
  const { user, admin } = await requireAdminPermission('billing.manage');
  const form = await request.formData(); const batchId = String(form.get('batchId') ?? ''); const payoutItemId = String(form.get('payoutItemId') ?? '') || null;
  const evidenceType = String(form.get('evidenceType') ?? ''); const file = form.get('file'); const note = String(form.get('note') ?? '') || null;
  if (!batchId || !['bank_receipt', 'bank_statement'].includes(evidenceType) || !(file instanceof File)) return NextResponse.json({ error: 'Dữ liệu chứng từ không hợp lệ.' }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Chứng từ tối đa 15MB.' }, { status: 400 });
  const { data: batch } = await admin.from('payout_batches').select('id').eq('id', batchId).maybeSingle(); if (!batch) return NextResponse.json({ error: 'Không tìm thấy đợt chi.' }, { status: 404 });
  if (payoutItemId) { const { data: item } = await admin.from('payout_items').select('id').eq('id', payoutItemId).eq('batch_id', batchId).maybeSingle(); if (!item) return NextResponse.json({ error: 'Dòng chi không thuộc đợt.' }, { status: 400 }); }
  const bytes = new Uint8Array(await file.arrayBuffer()); const key = `payout-evidence/${batchId}/receipts/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await putSubmissionObject(key, bytes, file.type || 'application/octet-stream');
  const { error } = await admin.from('payout_evidence').insert({ batch_id: batchId, payout_item_id: payoutItemId, evidence_type: evidenceType, storage_path: key, original_name: file.name, sha256: createHash('sha256').update(bytes).digest('hex'), uploaded_by: user.id, note });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
