import Link from 'next/link';
import { HardDrive, Layers3, MessageCircleMore, Sparkles, UsersRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import type { QuotaMetric, UserBillingContext, UserQuotaSnapshot } from '@/lib/billing/types';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 * 1024 ? 1 : 0)} GB`;
}

function quotaLabel(metric: QuotaMetric, format = (value: number) => String(value)) {
  return metric.limit === null ? `${format(metric.used)} đã dùng` : `${format(metric.used)} / ${format(metric.limit)}`;
}

function quotaTone(metric: Pick<QuotaMetric, 'isNearLimit' | 'isExhausted'>) {
  return metric.isExhausted ? 'bg-destructive' : metric.isNearLimit ? 'bg-amber-500' : 'bg-primary';
}

function UsageRow({ icon: Icon, label, detail, metric, format }: { icon: typeof Layers3; label: string; detail: string; metric: QuotaMetric; format?: (value: number) => string }) {
  const renderValue = format ?? ((value: number) => String(value));
  return <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-2">
    <span className="row-span-2 grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>
    <div className="flex min-w-0 items-baseline justify-between gap-3"><p className="font-medium text-foreground">{label}</p><p className="shrink-0 text-sm font-semibold text-foreground">{quotaLabel(metric, renderValue)}</p></div>
    <div className="min-w-0"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-[width] ${quotaTone(metric)}`} style={{ width: `${Math.min(metric.percent ?? 0, 100)}%` }} /></div><p className="mt-1.5 text-xs text-muted-foreground">{metric.limit === null ? 'Không giới hạn' : metric.remaining === 0 ? 'Đã dùng hết hạn mức' : `Còn ${renderValue(metric.remaining ?? 0)} · ${detail}`}</p></div>
  </div>;
}

export function SubscriptionQuotaCard({ context, quota }: { context: UserBillingContext; quota: UserQuotaSnapshot }) {
  const renewsAt = context.subscription?.currentPeriodEnd ? dateFormatter.format(new Date(context.subscription.currentPeriodEnd)) : null;
  const needsAttention = [quota.classes, quota.conversations, quota.storage].some((metric) => metric.isNearLimit) || quota.peakClass.isNearLimit;
  const peakMetric: QuotaMetric = { used: quota.peakClass.students, limit: quota.peakClass.limit, remaining: quota.peakClass.remaining, percent: quota.peakClass.percent, isNearLimit: quota.peakClass.isNearLimit, isExhausted: quota.peakClass.isExhausted };

  return <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <div className="flex flex-col gap-4 border-b bg-muted/30 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Gói {context.plan.name}</span>{context.mode === 'free_access' && <span className="text-xs text-muted-foreground">Được hệ thống cấp quyền tạm thời</span>}</div><h2 className="mt-3 text-lg font-semibold tracking-tight">Gói & hạn mức sử dụng</h2><p className="mt-1 text-sm text-muted-foreground">{renewsAt ? `${context.subscription?.cancelAtPeriodEnd ? 'Gói kết thúc' : 'Gia hạn'} ngày ${renewsAt}.` : 'Bạn đang dùng gói mặc định của Mari.'}</p></div>
      <Link href="/pricing" className={buttonVariants({ variant: needsAttention ? 'default' : 'outline', className: 'shrink-0' })}>{needsAttention ? 'Nâng cấp gói' : 'Xem gói'}</Link>
    </div>
    <div className="grid gap-x-8 gap-y-6 px-5 py-5 md:grid-cols-2">
      <UsageRow icon={Layers3} label="Lớp đang hoạt động" detail="lớp theo gói" metric={quota.classes} />
      <UsageRow icon={MessageCircleMore} label="Đoạn chat đang hoạt động" detail="chat theo gói" metric={quota.conversations} />
      <UsageRow icon={HardDrive} label="Dung lượng tài liệu Mari" detail="tài liệu đã đăng qua Mari" metric={quota.storage} format={formatBytes} />
      <UsageRow icon={UsersRound} label={quota.peakClass.name ? `Học sinh/lớp · ${quota.peakClass.name}` : 'Học sinh/lớp'} detail={quota.peakClass.name ? 'lớp gần đầy nhất' : 'chưa có lớp hoạt động'} metric={peakMetric} />
    </div>
  </section>;
}
