import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createHash } from 'crypto';
import { requireAdminPermission } from '@/lib/admin/server';
import { putSubmissionObject } from '@/lib/r2/server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, admin } = await requireAdminPermission('billing.manage');
  const { data: batch } = await admin.from('payout_batches').select('*').eq('id', id).single();
  if (!batch) return NextResponse.json({ error: 'Không tìm thấy đợt chi' }, { status: 404 });
  const { data: items } = await admin.from('payout_items').select('*').eq('batch_id', id).order('account_number_snapshot');
  const rows = (items ?? []).map((item, index) => ({ STT: index + 1, 'Ngân hàng': item.bank_name_snapshot, 'Số tài khoản': item.account_number_snapshot, 'Chủ tài khoản': item.account_name_snapshot, 'Số tiền': Number(item.amount), 'Nội dung': `MARI ${batch.batch_date} ${item.id.slice(0, 8)}` }));
  const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, 'KienlongBank');
  const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const filename = `mari-kienlongbank-${batch.batch_date}.xlsx`; const key = `payout-evidence/${id}/exports/${Date.now()}-${filename}`;
  const hash = createHash('sha256').update(bytes).digest('hex');
  await putSubmissionObject(key, bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await admin.from('payout_evidence').insert({ batch_id: id, evidence_type: 'export_file', storage_path: key, original_name: filename, sha256: hash, uploaded_by: user.id, note: 'Bảng kê KienlongBank xuất từ Mari' });
  await admin.from('payout_batches').update({ status: batch.status === 'approved' ? 'exported' : batch.status }).eq('id', id);
  return new NextResponse(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"` } });
}
