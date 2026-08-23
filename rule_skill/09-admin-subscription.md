## 1. Subscription Model

```
+----------------+     +----------------+     +----------------+
|     Admin      |     |    Teacher     |     |     Plans      |
|                |     |                |     |                |
| - Toggle       |     | - Trial        |     | - Free         |
|   billing mode |     | - Active       |     | - Pro Monthly  |
| - Set pricing  |     | - Expired      |     | - Pro Yearly   |
| - View revenue |     | - Cancelled    |     | - Enterprise   |
+----------------+     +----------------+     +----------------+
```

## 2. Subscription Lifecycle

```
[NEW TEACHER] -> [TRIAL 30 DAYS] -> [ACTIVE PAID]
                      |                  |
                      |                  +-> [CANCELLED]
                      |                       (het han khong gia han)
                      |
                      +-> [TRIAL EXPIRED] -> [GRACE PERIOD 7 DAYS]
                                                |
                                                +-> [SUSPENDED]
                                                     (khong the dung app)
```

## 3. Domain Model

```typescript
// src/domains/subscription/entities/subscription.ts
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export class Subscription extends AggregateRoot {
  private constructor(
    id: string,
    private teacherId: string,
    private planId: string,
    private status: SubscriptionStatus,
    private trialEndsAt: Date | null,
    private currentPeriodStart: Date,
    private currentPeriodEnd: Date,
    private cancelAtPeriodEnd: boolean
  ) {
    super(id);
  }

  static createTrial(teacherId: string, planId: string, days: number = 30): Subscription {
    const now = new Date();
    const trialEnd = addDays(now, days);
    
    const sub = new Subscription(
      generateId(),
      teacherId,
      planId,
      SubscriptionStatus.TRIAL,
      trialEnd,
      now,
      trialEnd,
      false
    );
    
    sub.addDomainEvent(new TrialStartedEvent(teacherId, trialEnd));
    return sub;
  }

  activate(paymentMethodId: string): Result<void> {
    if (this.status !== SubscriptionStatus.TRIAL && 
        this.status !== SubscriptionStatus.EXPIRED) {
      return Result.fail(new DomainError("Can only activate from trial or expired state"));
    }
    
    this.status = SubscriptionStatus.ACTIVE;
    this.trialEndsAt = null;
    this.currentPeriodStart = new Date();
    this.currentPeriodEnd = addMonths(new Date(), 1);
    
    this.addDomainEvent(new SubscriptionActivatedEvent(this.teacherId, this.planId));
    return Result.ok(undefined);
  }

  cancel(): Result<void> {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      return Result.fail(new DomainError("Can only cancel active subscription"));
    }
    
    this.cancelAtPeriodEnd = true;
    this.addDomainEvent(new SubscriptionCancelledEvent(this.teacherId));
    return Result.ok(undefined);
  }

  isExpired(): boolean {
    if (this.status === SubscriptionStatus.TRIAL && this.trialEndsAt) {
      return new Date() > this.trialEndsAt;
    }
    return new Date() > this.currentPeriodEnd;
  }

  canUseFeature(feature: string): boolean {
    if (this.isExpired()) return false;
    // Check plan features
    return true;
  }
}
```

## 4. Plan Configuration

```typescript
// src/domains/subscription/entities/plan.ts
export interface PlanFeatures {
  maxStudents: number;
  maxClasses: number;
  maxStorageGB: number;
  hasPaymentGateway: boolean;
  hasAdvancedAnalytics: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
}

export class Plan extends Entity {
  constructor(
    id: string,
    private name: string,
    private description: string,
    private priceMonthly: Money,
    private priceYearly: Money,
    private features: PlanFeatures,
    private isActive: boolean
  ) {
    super(id);
  }

  static defaultPlans(): Plan[] {
    return [
      new Plan(
        'plan_free',
        'Mien phi',
        'Dung thu co ban',
        Money.zero(),
        Money.zero(),
        { maxStudents: 5, maxClasses: 2, maxStorageGB: 1, 
          hasPaymentGateway: false, hasAdvancedAnalytics: false,
          hasCustomBranding: false, hasPrioritySupport: false },
        true
      ),
      new Plan(
        'plan_pro_monthly',
        'Pro - Thang',
        'Day du tinh nang cho giao vien',
        new Money(99000),
        new Money(0),
        { maxStudents: 50, maxClasses: 10, maxStorageGB: 10,
          hasPaymentGateway: true, hasAdvancedAnalytics: true,
          hasCustomBranding: false, hasPrioritySupport: false },
        true
      ),
      new Plan(
        'plan_pro_yearly',
        'Pro - Nam',
        'Tiet kiem 20%',
        new Money(0),
        new Money(950000),
        { maxStudents: 50, maxClasses: 10, maxStorageGB: 10,
          hasPaymentGateway: true, hasAdvancedAnalytics: true,
          hasCustomBranding: false, hasPrioritySupport: false },
        true
      )
    ];
  }
}
```

## 5. Admin Controls

```typescript
// src/application/services/admin/subscription-admin.service.ts
export class SubscriptionAdminService {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private planRepo: IPlanRepository,
    private configRepo: ISystemConfigRepository
  ) {}

  // Bat/tat che do thu phi toan he thong
  async toggleBillingMode(adminId: string, enabled: boolean): Promise<Result<void>> {
    await this.configRepo.set('BILLING_ENABLED', enabled.toString());
    
    if (enabled) {
      // Kich hoat trial 30 ngay cho tat ca giao vien chua co subscription
      const teachers = await this.getTeachersWithoutSubscription();
      for (const teacher of teachers) {
        const trial = Subscription.createTrial(teacher.id, 'plan_pro_monthly');
        await this.subscriptionRepo.save(trial);
      }
    }
    
    return Result.ok(undefined);
  }

  // Cap nhat gia goi
  async updatePlanPricing(
    adminId: string, 
    planId: string, 
    monthlyPrice: number,
    yearlyPrice: number
  ): Promise<Result<void>> {
    const plan = await this.planRepo.findById(planId);
    if (!plan) return Result.fail(new DomainError("Plan not found"));
    
    // Khong the cap nhat gia xuong duoi chi phi van hanh
    if (monthlyPrice < 50000) {
      return Result.fail(new DomainError("Price too low"));
    }
    
    plan.updatePricing(new Money(monthlyPrice), new Money(yearlyPrice));
    await this.planRepo.save(plan);
    
    return Result.ok(undefined);
  }

  // Thong ke doanh thu
  async getRevenueReport(
    adminId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueReport> {
    const subscriptions = await this.subscriptionRepo.findActiveInPeriod(startDate, endDate);
    
    return {
      totalRevenue: subscriptions.reduce((sum, s) => sum + s.amountPaid, 0),
      totalTeachers: subscriptions.length,
      newTrials: subscriptions.filter(s => s.status === 'trial').length,
      conversionRate: this.calculateConversionRate(subscriptions),
      churnRate: this.calculateChurnRate(subscriptions),
      mrr: this.calculateMRR(subscriptions),
      arr: this.calculateARR(subscriptions)
    };
  }
}
```

## 6. Middleware - Subscription Guard

```typescript
// src/app/middleware/subscription-guard.ts
export async function subscriptionGuard(
  request: NextRequest,
  requiredFeature?: string
) {
  const user = await getCurrentUser();
  
  if (user.role === 'admin') return; // Admin khong bi gioi han
  
  const subscription = await getSubscription(user.id);
  
  if (!subscription || subscription.isExpired()) {
    return redirect('/subscription/expired');
  }
  
  if (requiredFeature && !subscription.canUseFeature(requiredFeature)) {
    return redirect('/subscription/upgrade');
  }
  
  // Kiem tra gioi han so hoc sinh/lop
  const usage = await getUsageStats(user.id);
  if (usage.studentsCount > subscription.plan.features.maxStudents) {
    return redirect('/subscription/upgrade?reason=limit');
  }
}
```

## 7. Cron Jobs (Vercel Cron)

```typescript
// src/app/api/cron/check-subscriptions/route.ts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 1. Check trial expiry
  const expiringTrials = await subscriptionRepo.findExpiringTrials(3); // 3 ngay
  for (const sub of expiringTrials) {
    await notificationService.sendTrialExpiryReminder(sub.teacherId, sub.trialEndsAt!);
  }
  
  // 2. Check subscription renewal
  const renewingSubs = await subscriptionRepo.findRenewingSoon(7); // 7 ngay
  for (const sub of renewingSubs) {
    await notificationService.sendRenewalReminder(sub.teacherId, sub.currentPeriodEnd);
  }
  
  // 3. Auto-suspend expired
  const expiredSubs = await subscriptionRepo.findExpired();
  for (const sub of expiredSubs) {
    await subscriptionAdminService.suspendTeacher(sub.teacherId);
    await notificationService.sendSubscriptionExpired(sub.teacherId);
  }
  
  return Response.json({ processed: expiredSubs.length });
}
```

## 8. Pricing Strategy (De xuat)

| Goi | Gia thang | Gia nam | Hoc sinh toi da | Lop toi da | Tinh nang dac biet |
|-----|-----------|---------|-----------------|------------|-------------------|
| Mien phi | 0d | 0d | 5 | 2 | Co ban |
| Pro | 99.000d | 950.000d | 50 | 10 | Thanh toan, thong ke thue |
| Premium | 199.000d | 1.900.000d | 200 | Khong gioi han | White-label, API access |

**Chinh sach:**
- 30 ngay dung thu Pro cho giao vien moi
- Giam 20% khi mua goi nam
- Hoan tien trong 7 ngay neu khong hai long
""")
