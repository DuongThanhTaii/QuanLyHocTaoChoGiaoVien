import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/admin/server';
import { decryptCassoSecret, verifyCassoWebhookSignature } from '@/lib/casso/server';

type CassoTransaction = { id?: string | number; amount?: number | string; description?: string; tid?: string; bankSubAccId?: string; bank_sub_acc_id?: string };

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-casso-signature') ?? request.headers.get('secure-token');
  const payload = JSON.parse(rawBody) as { error?: number; data?: CassoTransaction[] };
  const transactions = Array.isArray(payload.data) ? payload.data : [];
  const admin = getServiceClient();
  const { data: connections, error } = await admin.from('casso_connections').select('id, teacher_id, bank_account_id, webhook_secret_encrypted').eq('status', 'active');
  if (error || !connections?.length) return NextResponse.json({ ok: false, message: 'Không có kết nối Casso hoạt động.' }, { status: 401 });

  const connection = connections.find((item) => {
    try {
      const secret = decryptCassoSecret(item.webhook_secret_encrypted);
      return signature === secret || verifyCassoWebhookSignature(rawBody, signature, secret);
    } catch { return false; }
  });
  if (!connection) return NextResponse.json({ ok: false, message: 'Webhook Casso không hợp lệ.' }, { status: 401 });

  for (const transaction of transactions) {
    const transactionId = String(transaction.id ?? transaction.tid ?? crypto.createHash('sha256').update(JSON.stringify(transaction)).digest('hex'));
    const { error: eventError } = await admin.from('casso_webhook_events').insert({ casso_transaction_id: transactionId, connection_id: connection.id, payload: transaction, signature, verified: true });
    if (eventError?.code === '23505') continue;
    if (eventError) continue;

    const amount = Number(transaction.amount ?? 0);
    const description = String(transaction.description ?? '');
    const invoiceRef = description.match(/[A-Z]{2,}[\-_]?\d{4,}/i)?.[0] ?? '';
    const query = admin.from('invoices').select('id, total_amount, status, invoice_number').eq('teacher_id', connection.teacher_id).in('status', ['sent', 'overdue']);
    const { data: candidates } = invoiceRef ? await query.ilike('invoice_number', `%${invoiceRef}%`) : await query.eq('total_amount', amount);
    const matching = (candidates ?? []).filter((invoice) => Number(invoice.total_amount) === amount && (!invoiceRef || invoice.invoice_number.toLowerCase().includes(invoiceRef.toLowerCase())));

    if (matching.length === 1) {
      const invoice = matching[0];
      await admin.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString(), paid_amount: amount, payment_method: 'bank_transfer', payment_reference: `casso:${transactionId}`, updated_at: new Date().toISOString() }).eq('id', invoice.id).neq('status', 'paid');
      await admin.from('payment_transactions').insert({ invoice_id: invoice.id, amount, method: 'bank_transfer', status: 'paid', gateway_response: { gateway: 'casso', transactionId, description } });
      await admin.from('casso_reconciliation_queue').insert({ connection_id: connection.id, invoice_id: invoice.id, casso_transaction_id: transactionId, amount, transfer_content: description, status: 'matched', reason: 'Khớp duy nhất theo mã hóa đơn và số tiền', resolved_at: new Date().toISOString() });
    } else {
      await admin.from('casso_reconciliation_queue').insert({ connection_id: connection.id, casso_transaction_id: transactionId, amount, transfer_content: description, status: 'pending', reason: matching.length ? 'Có nhiều hóa đơn trùng khớp' : 'Không tìm thấy hóa đơn khớp' });
    }
    await admin.from('casso_webhook_events').update({ processed_at: new Date().toISOString() }).eq('casso_transaction_id', transactionId);
  }
  return NextResponse.json({ ok: true });
}
