'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setSubscriptionAutoRenew } from './actions';

export function BillingManagementClient({ subscription, planName }: { subscription: { autoRenew: boolean; periodEnd: string | null; renewalStatus: string } | null; planName: string }) {
  const [pending, setPending] = useState(false);
  const [autoRenew, setAutoRenew] = useState(subscription?.autoRenew ?? false);
  const toggle = async () => {
    const next = !autoRenew;
    if (!next && !window.confirm('Tắt gia hạn tự động? Bạn vẫn dùng gói hiện tại đến hết chu kỳ.')) return;
    setPending(true);
    try { await setSubscriptionAutoRenew(next); setAutoRenew(next); toast.success(next ? 'Đã bật gia hạn tự động.' : 'Đã hủy gia hạn tự động.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Không thể cập nhật gia hạn.'); }
    finally { setPending(false); }
  };
  const date = subscription?.periodEnd ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(subscription.periodEnd)) : '—';
  return <div className="max-w-3xl space-y-6">
    <header><p className="text-sm font-semibold text-primary">Gói đăng ký</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Quản lý gia hạn</h1></header>
    <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><CreditCard className="size-5" /></span><div><p className="font-semibold">Gói {planName}</p><p className="mt-1 text-sm text-muted-foreground">{subscription ? `Kết thúc chu kỳ hiện tại: ${date}` : 'Bạn đang dùng gói miễn phí.'}</p></div></div>{subscription && <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${autoRenew ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{autoRenew ? 'Tự gia hạn đang bật' : 'Sẽ hết hạn cuối kỳ'}</span>}</div>
      {subscription && <div className="border-t border-border px-6 py-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Gia hạn tự động</p><p className="mt-1 max-w-xl text-sm text-muted-foreground">Mari sẽ gia hạn gói khi kết thúc chu kỳ, trừ khi bạn tắt tại đây. Bạn sẽ được thông báo trước ngày gia hạn.</p></div><Button type="button" variant={autoRenew ? 'outline' : 'default'} disabled={pending} onClick={toggle}>{pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : autoRenew ? <CalendarClock className="mr-2 size-4" /> : <CheckCircle2 className="mr-2 size-4" />}{autoRenew ? 'Tắt gia hạn' : 'Bật gia hạn'}</Button></div></div>}
    </section>
  </div>;
}
