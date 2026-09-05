export type BillingMode = 'paid' | 'free_access';
export type BillingInterval = 'monthly' | 'yearly';
export type PlanCode = 'free' | 'pro' | 'max' | 'enterprise';

export type PlanEntitlements = {
  maxClasses: number | null;
  maxStudentsPerClass: number | null;
  maxActiveConversations: number | null;
  maxStorageGb: number | null;
  canCollectTuition: boolean;
  canAdvancedAnalytics: boolean;
  canCustomBranding: boolean;
  canPrioritySupport: boolean;
  canManageTeam: boolean;
};

export type BillingPlan = {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  isActive: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  entitlements: PlanEntitlements;
};

export type UserBillingContext = {
  mode: BillingMode;
  plan: BillingPlan;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    autoRenew?: boolean;
    nextRenewalAt?: string | null;
    renewalStatus?: string;
  } | null;
};

export type QuotaMetric = {
  used: number;
  limit: number | null;
  remaining: number | null;
  percent: number | null;
  isNearLimit: boolean;
  isExhausted: boolean;
};

export type UserQuotaSnapshot = {
  classes: QuotaMetric;
  conversations: QuotaMetric;
  storage: QuotaMetric;
  peakClass: {
    name: string | null;
    students: number;
    limit: number | null;
    remaining: number | null;
    percent: number | null;
    isNearLimit: boolean;
    isExhausted: boolean;
  };
};
