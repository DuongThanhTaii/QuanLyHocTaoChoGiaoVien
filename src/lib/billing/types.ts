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
  } | null;
};
