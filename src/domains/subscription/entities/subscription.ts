import { AggregateRoot } from '../../shared/aggregate-root';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/domain-error';
import { addDays, addMonths } from 'date-fns';
import { DomainEvent } from '../../shared/domain-event';
import { v4 as uuidv4 } from 'uuid';

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export class TrialStartedEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'TRIAL_STARTED';
  constructor(public readonly teacherId: string, public readonly trialEndsAt: Date) {}
}

export class SubscriptionActivatedEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'SUBSCRIPTION_ACTIVATED';
  constructor(public readonly teacherId: string, public readonly planId: string) {}
}

export class SubscriptionCancelledEvent implements DomainEvent {
  occurredOn = new Date();
  eventType = 'SUBSCRIPTION_CANCELLED';
  constructor(public readonly teacherId: string) {}
}

export class Subscription extends AggregateRoot {
  private constructor(
    id: string,
    private _teacherId: string,
    private _planId: string,
    private _status: SubscriptionStatus,
    private _trialEndsAt: Date | null,
    private _currentPeriodStart: Date,
    private _currentPeriodEnd: Date,
    private _cancelAtPeriodEnd: boolean
  ) {
    super(id);
  }

  static createTrial(teacherId: string, planId: string, days: number = 30): Subscription {
    const now = new Date();
    const trialEnd = addDays(now, days);
    
    const sub = new Subscription(
      uuidv4(),
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
    if (this._status !== SubscriptionStatus.TRIAL && 
        this._status !== SubscriptionStatus.EXPIRED) {
      return Result.fail(new DomainError("Can only activate from trial or expired state"));
    }
    
    this._status = SubscriptionStatus.ACTIVE;
    this._trialEndsAt = null;
    this._currentPeriodStart = new Date();
    this._currentPeriodEnd = addMonths(new Date(), 1);
    this._cancelAtPeriodEnd = false;
    
    this.addDomainEvent(new SubscriptionActivatedEvent(this._teacherId, this._planId));
    return Result.ok(undefined);
  }

  cancel(): Result<void> {
    if (this._status !== SubscriptionStatus.ACTIVE) {
      return Result.fail(new DomainError("Can only cancel active subscription"));
    }
    
    this._cancelAtPeriodEnd = true;
    this.addDomainEvent(new SubscriptionCancelledEvent(this._teacherId));
    return Result.ok(undefined);
  }

  isExpired(): boolean {
    if (this._status === SubscriptionStatus.TRIAL && this._trialEndsAt) {
      return new Date() > this._trialEndsAt;
    }
    return new Date() > this._currentPeriodEnd;
  }
  
  // Getters
  get status() { return this._status; }
  get teacherId() { return this._teacherId; }
  get planId() { return this._planId; }
}
