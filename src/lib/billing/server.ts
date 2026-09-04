import { getServiceClient, requireAdminPermission } from '@/lib/admin/server';
import type { BillingMode, BillingPlan, PlanCode, PlanEntitlements, QuotaMetric, UserBillingContext, UserQuotaSnapshot } from './types';

type PlanRow = { id: string; code: PlanCode; name: string; description: string | null; is_active: boolean; display_order: number };
type EntitlementRow = {
  plan_id: string; max_classes: number | null; max_students_per_class: number | null;
  max_active_conversations: number | null; max_storage_gb: number | null;
  can_collect_tuition: boolean; can_advanced_analytics: boolean; can_custom_branding: boolean;
  can_priority_support: boolean; can_manage_team: boolean;
};
type PriceRow = { id: string; plan_id: string; interval: 'monthly' | 'yearly'; amount: number | string; effective_from: string };

function mapEntitlements(row: EntitlementRow): PlanEntitlements {
  return {
    maxClasses: row.max_classes, maxStudentsPerClass: row.max_students_per_class,
    maxActiveConversations: row.max_active_conversations, maxStorageGb: row.max_storage_gb,
    canCollectTuition: row.can_collect_tuition, canAdvancedAnalytics: row.can_advanced_analytics,
    canCustomBranding: row.can_custom_branding, canPrioritySupport: row.can_priority_support,
    canManageTeam: row.can_manage_team,
  };
}

export async function getBillingPlans(includeInactive = false): Promise<BillingPlan[]> {
  const admin = getServiceClient();
  const now = new Date().toISOString();
  let plansQuery = admin.from('plans').select('id, code, name, description, is_active, display_order').not('code', 'is', null).order('display_order');
  if (!includeInactive) plansQuery = plansQuery.eq('is_active', true);
  const [plansResult, entitlementsResult, pricesResult] = await Promise.all([
    plansQuery,
    admin.from('plan_entitlements').select('*'),
    admin.from('plan_price_versions').select('id, plan_id, interval, amount, effective_from').lte('effective_from', now).or(`effective_until.is.null,effective_until.gt.${now}`),
  ]);
  if (plansResult.error || entitlementsResult.error || pricesResult.error) {
    throw new Error(plansResult.error?.message || entitlementsResult.error?.message || pricesResult.error?.message || 'Không thể tải gói cước.');
  }
  const entitlements = new Map((entitlementsResult.data as EntitlementRow[]).map((row) => [row.plan_id, mapEntitlements(row)]));
  const prices = new Map<string, PriceRow>();
  for (const price of pricesResult.data as PriceRow[]) prices.set(`${price.plan_id}:${price.interval}`, price);
  return (plansResult.data as PlanRow[]).map((plan) => ({
    id: plan.id, code: plan.code, name: plan.name, description: plan.description, isActive: plan.is_active,
    monthlyPrice: Number(prices.get(`${plan.id}:monthly`)?.amount ?? 0),
    yearlyPrice: Number(prices.get(`${plan.id}:yearly`)?.amount ?? 0),
    entitlements: entitlements.get(plan.id) ?? {
      maxClasses: 0, maxStudentsPerClass: 0, maxActiveConversations: 0, maxStorageGb: 0,
      canCollectTuition: false, canAdvancedAnalytics: false, canCustomBranding: false, canPrioritySupport: false, canManageTeam: false,
    },
  }));
}

export async function getUserBillingContext(userId: string): Promise<UserBillingContext> {
  const admin = getServiceClient();
  const [settingsResult, entitlementResult, subscriptionResult, plans] = await Promise.all([
    admin.from('billing_settings').select('mode').eq('singleton', true).single(),
    admin.rpc('get_effective_entitlement', { target_user_id: userId }).single(),
    admin.from('subscriptions').select('id, status, current_period_end, cancel_at_period_end, plan_id').eq('teacher_id', userId).in('status', ['active', 'trial']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    getBillingPlans(),
  ]);
  if (settingsResult.error || entitlementResult.error) throw new Error(settingsResult.error?.message || entitlementResult.error?.message || 'Không thể tải quyền sử dụng.');
  const entitlement = entitlementResult.data as Record<string, unknown>;
  const plan = plans.find((item) => item.code === entitlement.plan_code);
  if (!plan) throw new Error('Không tìm thấy gói quyền sử dụng hiện tại.');
  return {
    mode: settingsResult.data.mode as BillingMode,
    plan,
    subscription: subscriptionResult.data ? {
      id: subscriptionResult.data.id, status: subscriptionResult.data.status,
      currentPeriodEnd: subscriptionResult.data.current_period_end,
      cancelAtPeriodEnd: subscriptionResult.data.cancel_at_period_end,
    } : null,
  };
}

function toQuotaMetric(used: number, limit: number | null): QuotaMetric {
  const percent = limit === null ? null : limit === 0 ? (used > 0 ? 100 : 0) : Math.round((used / limit) * 100);
  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    percent,
    isNearLimit: percent !== null && percent >= 80,
    isExhausted: limit !== null && used >= limit,
  };
}

export async function getUserQuotaSnapshot(userId: string): Promise<UserQuotaSnapshot> {
  const admin = getServiceClient();
  const { data, error } = await admin.rpc('get_billing_usage', { target_user_id: userId }).single();
  if (error || !data) throw new Error(error?.message || 'Không thể tải hạn mức sử dụng.');
  const usage = data as {
    active_classes: number; active_conversations: number; storage_bytes: number | string;
    peak_class_name: string | null; peak_class_students: number | null;
    max_classes: number | null; max_students_per_class: number | null;
    max_active_conversations: number | null; max_storage_gb: number | null;
  };
  const storageLimit = usage.max_storage_gb === null ? null : Number(usage.max_storage_gb) * 1024 * 1024 * 1024;
  const peakStudents = Number(usage.peak_class_students ?? 0);
  const peakLimit = usage.max_students_per_class === null ? null : Number(usage.max_students_per_class);
  const peak = toQuotaMetric(peakStudents, peakLimit);
  return {
    classes: toQuotaMetric(Number(usage.active_classes), usage.max_classes === null ? null : Number(usage.max_classes)),
    conversations: toQuotaMetric(Number(usage.active_conversations), usage.max_active_conversations === null ? null : Number(usage.max_active_conversations)),
    storage: toQuotaMetric(Number(usage.storage_bytes), storageLimit),
    peakClass: { name: usage.peak_class_name, students: peakStudents, limit: peakLimit, remaining: peak.remaining, percent: peak.percent, isNearLimit: peak.isNearLimit, isExhausted: peak.isExhausted },
  };
}

export async function getAdminBillingOverview() {
  const { admin } = await requireAdminPermission('billing.manage');
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [settings, plans, paidOrders, pendingOrders, subscriptions, recentOrders] = await Promise.all([
    admin.from('billing_settings').select('mode, free_access_plan_code, updated_at').eq('singleton', true).single(),
    getBillingPlans(true),
    admin.from('platform_orders').select('amount').eq('status', 'paid').gte('paid_at', monthStart),
    admin.from('platform_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('subscriptions').select('status, plans(code)').in('status', ['active', 'trial']),
    admin.from('platform_orders').select('id, order_code, amount, status, created_at, paid_at, user:profiles!platform_orders_user_id_fkey(full_name,email), plan:plans!platform_orders_plan_id_fkey(name,code)').order('created_at', { ascending: false }).limit(12),
  ]);
  if (settings.error || paidOrders.error || pendingOrders.error || subscriptions.error || recentOrders.error) {
    throw new Error(settings.error?.message || paidOrders.error?.message || pendingOrders.error?.message || subscriptions.error?.message || recentOrders.error?.message || 'Không thể tải billing.');
  }
  return {
    settings: settings.data,
    plans,
    revenueThisMonth: (paidOrders.data ?? []).reduce((sum, order) => sum + Number(order.amount), 0),
    pendingOrders: pendingOrders.count ?? 0,
    activeSubscriptions: subscriptions.data?.length ?? 0,
    subscriptions: subscriptions.data ?? [],
    recentOrders: recentOrders.data ?? [],
  };
}
