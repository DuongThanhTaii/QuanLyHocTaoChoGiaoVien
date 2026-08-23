import { Entity } from '../../shared/entity';
import { Money } from '../../shared/value-objects';

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
    private _name: string,
    private _description: string,
    private _priceMonthly: Money,
    private _priceYearly: Money,
    private _features: PlanFeatures,
    private _isActive: boolean
  ) {
    super(id);
  }

  updatePricing(monthly: Money, yearly: Money) {
    this._priceMonthly = monthly;
    this._priceYearly = yearly;
  }

  get features() { return this._features; }
  get priceMonthly() { return this._priceMonthly; }
  get priceYearly() { return this._priceYearly; }
  get isActive() { return this._isActive; }

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
