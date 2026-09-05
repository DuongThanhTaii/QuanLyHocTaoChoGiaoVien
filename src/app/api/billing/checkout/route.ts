import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';
import { createPayOSPaymentLink } from '@/lib/billing/payos';

const CheckoutSchema = z.object({ planCode: z.enum(['pro', 'max']), interval: z.enum(['monthly', 'yearly']) });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập để nâng cấp gói.' }, { status: 401 });
    const input = CheckoutSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: 'Gói hoặc chu kỳ thanh toán không hợp lệ.' }, { status: 400 });

    const admin = getServiceClient();
    const [settingResult, planResult] = await Promise.all([
      admin.from('billing_settings').select('mode').eq('singleton', true).single(),
      admin.from('plans').select('id, code, name, is_active').eq('code', input.data.planCode).eq('is_active', true).single(),
    ]);
    if (settingResult.error || planResult.error) throw new Error(settingResult.error?.message || planResult.error?.message || 'Không thể đọc cấu hình thanh toán.');
    if (settingResult.data.mode !== 'paid') return NextResponse.json({ error: 'Hệ thống đang ở chế độ truy cập miễn phí; chưa cần thanh toán.' }, { status: 409 });

    const now = new Date().toISOString();
    const { data: price, error: priceError } = await admin.from('plan_price_versions')
      .select('id, amount').eq('plan_id', planResult.data.id).eq('interval', input.data.interval)
      .lte('effective_from', now).or(`effective_until.is.null,effective_until.gt.${now}`).order('effective_from', { ascending: false }).limit(1).single();
    if (priceError || !price || Number(price.amount) <= 0) return NextResponse.json({ error: 'Gói này chưa có giá bán hợp lệ.' }, { status: 409 });

    const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data: order, error: orderError } = await admin.from('platform_orders').insert({
      user_id: user.id, plan_id: planResult.data.id, price_version_id: price.id, interval: input.data.interval,
      amount: Number(price.amount), order_code: orderCode,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      price_snapshot: { planCode: planResult.data.code, planName: planResult.data.name, amount: Number(price.amount), interval: input.data.interval },
    }).select('id').single();
    if (orderError || !order) throw new Error(orderError?.message || 'Không thể tạo đơn thanh toán.');

    try {
      const payment = await createPayOSPaymentLink({
        orderCode, amount: Number(price.amount), description: `Mari ${planResult.data.name}`.slice(0, 25),
        buyerName: user.user_metadata.full_name || user.email || undefined, buyerEmail: user.email,
        items: [{ name: `${planResult.data.name} (${input.data.interval === 'yearly' ? 'năm' : 'tháng'})`, quantity: 1, price: Number(price.amount) }],
        returnUrl: `${origin}/pricing?payment=success&order=${orderCode}`,
        cancelUrl: `${origin}/pricing?payment=cancelled&order=${orderCode}`,
        expiredAt: Math.floor(Date.now() / 1000) + 30 * 60,
      });
      const { error: updateError } = await admin.from('platform_orders').update({
        payos_payment_link_id: payment.paymentLinkId, payos_checkout_url: payment.checkoutUrl, updated_at: new Date().toISOString(),
      }).eq('id', order.id);
      if (updateError) throw new Error(updateError.message);
      return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
    } catch (error) {
      await admin.from('platform_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể khởi tạo thanh toán.' }, { status: 500 });
  }
}
