import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { getServiceClient } from '@/lib/admin/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderCode: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });

  const { orderCode: rawOrderCode } = await params;
  const orderCode = Number(rawOrderCode);
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) return NextResponse.json({ error: 'Mã đơn không hợp lệ.' }, { status: 400 });

  const admin = getServiceClient();
  const { data: order, error } = await admin
    .from('platform_orders')
    .select('order_code, status, paid_at')
    .eq('order_code', orderCode)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: 'Không tìm thấy đơn thanh toán.' }, { status: 404 });
  return NextResponse.json({ orderCode: order.order_code, status: order.status, paidAt: order.paid_at });
}
