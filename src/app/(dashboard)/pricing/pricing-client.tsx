'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { BillingInterval, BillingPlan, UserBillingContext } from '@/lib/billing/types';

const money = new Intl.NumberFormat('vi-VN');

export function PricingClient({ context, plans }: { context: UserBillingContext; plans: BillingPlan[] }) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'failed' | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderCode = searchParams.get('order');
    if (searchParams.get('payment') !== 'success' || !orderCode) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (cancelled) return;
      setPaymentStatus('waiting');
      try {
        const response = await fetch(`/api/billing/orders/${encodeURIComponent(orderCode)}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.status === 'paid') {
          router.refresh();
          router.replace('/pricing?upgraded=1');
          return;
        }
        if (payload.status && !['pending'].includes(payload.status)) {
          setPaymentStatus('failed');
          return;
        }
      } catch {
        // Keep polling briefly; PayOS can redirect before its webhook reaches the server.
      }
      attempts += 1;
      if (attempts >= 30) { setPaymentStatus('failed'); return; }
      timer = setTimeout(poll, 2000);
    };
    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [router, searchParams]);
  const checkout = async (code: 'pro' | 'max') => {
    setPending(code); setError(null);
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planCode: code, interval }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.checkoutUrl) throw new Error(payload.error || 'Không thể khởi tạo thanh toán.');
      window.location.assign(payload.checkoutUrl);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể khởi tạo thanh toán.'); setPending(null); }
  };
  return <div className="mx-auto max-w-6xl space-y-8"><div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-primary">Gói sử dụng</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Bạn đang dùng gói {context.plan.name}</h1><p className="mt-2 text-sm text-muted-foreground">{context.mode === 'free_access' ? 'Hệ thống đang mở quyền miễn phí tạm thời.' : 'Nâng cấp khi số lớp, học sinh hoặc chat của bạn tăng lên.'}</p></div><div className="inline-flex w-fit rounded-lg bg-muted p-1"><button onClick={() => setInterval('monthly')} className={`rounded-md px-3 py-1.5 text-sm ${interval === 'monthly' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Theo tháng</button><button onClick={() => setInterval('yearly')} className={`rounded-md px-3 py-1.5 text-sm ${interval === 'yearly' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Theo năm</button></div></div>{paymentStatus === 'waiting' && <p className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary"><Loader2 className="size-4 animate-spin" />Đang xác nhận thanh toán và cập nhật hạn mức của bạn…</p>}{paymentStatus === 'failed' && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">Thanh toán đang chờ xác nhận. Vui lòng mở lại Hồ sơ sau ít phút để xem hạn mức mới.</p>}{error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}<div className="grid gap-5 lg:grid-cols-3">{plans.map((plan) => { const price = interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice; const current = plan.code === context.plan.code; return <section key={plan.id} className={`flex min-h-[430px] flex-col rounded-xl border p-6 ${plan.code === 'pro' ? 'border-primary shadow-sm' : ''}`}><div><p className="text-lg font-semibold">{plan.name}</p><p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p><p className="mt-6 text-3xl font-bold">{price ? `${money.format(price)} đ` : '0 đ'}<span className="ml-1 text-sm font-normal text-muted-foreground">/{interval === 'monthly' ? 'tháng' : 'năm'}</span></p></div><ul className="mt-6 space-y-3 text-sm"><Feature text={`${plan.entitlements.maxClasses} lớp đang hoạt động`} /><Feature text={`${plan.entitlements.maxStudentsPerClass} học sinh mỗi lớp`} /><Feature text={`${plan.entitlements.maxActiveConversations} đoạn chat đang hoạt động`} /><Feature text={`${plan.entitlements.maxStorageGb} GB lưu trữ`} /></ul><div className="mt-auto pt-7">{current ? <Button className="w-full" variant="secondary" disabled>Gói hiện tại</Button> : plan.code === 'free' ? <Button className="w-full" variant="outline" disabled>Gói mặc định</Button> : context.mode === 'free_access' ? <Button className="w-full" variant="outline" disabled>Đang mở quyền miễn phí</Button> : <Button className="w-full" onClick={() => checkout(plan.code as 'pro' | 'max')} disabled={pending !== null}>{pending === plan.code ? <><Loader2 className="mr-2 size-4 animate-spin" />Đang chuyển đến PayOS</> : `Chọn ${plan.name}`}</Button>}</div></section>; })}</div><p className="text-center text-sm text-muted-foreground">Gói Doanh nghiệp dành cho trung tâm và tổ chức; liên hệ hỗ trợ để nhận báo giá và cấu hình riêng.</p></div>;
}
function Feature({ text }: { text: string }) { return <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{text}</li>; }
