import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { getServiceClient } from '@/lib/admin/server';
import { verifyPayOSWebhook } from '@/lib/billing/payos';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody) as { code?: string; data?: Record<string, unknown>; signature?: string };
    if (!body.data || !verifyPayOSWebhook(body.data, body.signature)) {
      return NextResponse.json({ success: false, message: 'Webhook signature is invalid.' }, { status: 400 });
    }
    const admin = getServiceClient();
    const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    const { error: eventError } = await admin.from('payment_webhook_events').insert({
      event_hash: eventHash, signature: body.signature, payload: body, verified: true,
    });
    if (eventError?.code === '23505') return NextResponse.json({ success: true, duplicate: true });
    if (eventError) throw new Error(eventError.message);

    const orderCode = Number(body.data.orderCode);
    const amount = Number(body.data.amount);
    const { data: order, error: orderError } = await admin.from('platform_orders').select('id, amount, status').eq('order_code', orderCode).maybeSingle();
    // PayOS sends a signed sample event while confirming the webhook URL.
    if (!order && !orderError) return NextResponse.json({ success: true, confirmation: true });
    if (orderError || !order) throw new Error(orderError?.message || 'Không tìm thấy đơn thanh toán nền tảng.');
    if (Number(order.amount) !== amount) throw new Error('Số tiền webhook không khớp đơn hàng.');
    if (body.code !== '00' || body.data.code !== '00') return NextResponse.json({ success: true, ignored: true });

    const { data: subscriptionId, error: activationError } = await admin.rpc('activate_platform_order', {
      target_order_code: orderCode, transaction_reference: String(body.data.reference || body.data.paymentLinkId || ''),
    });
    if (activationError) throw new Error(activationError.message);
    if (subscriptionId) {
      const { data: subscription } = await admin.from('subscriptions').select('current_period_end').eq('id', subscriptionId).maybeSingle();
      await admin.from('subscriptions').update({
        auto_renew: true,
        next_renewal_at: subscription?.current_period_end ?? null,
        renewal_status: process.env.PAYOS_RECURRING_ENABLED === 'true' ? 'ready' : 'not_configured',
        renewal_attempt_count: 0,
      }).eq('id', subscriptionId);
    }
    await admin.from('payment_webhook_events').update({ processed_at: new Date().toISOString() }).eq('event_hash', eventHash);
    revalidatePath('/pricing');
    revalidatePath('/profile');
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : 'Webhook processing failed.' }, { status: 500 });
  }
}
