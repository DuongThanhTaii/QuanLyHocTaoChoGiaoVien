import { Subscription } from '../../domains/subscription/entities/subscription';

export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByTeacherId(teacherId: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
  findActiveInPeriod(startDate: Date, endDate: Date): Promise<Subscription[]>;
  findExpiringTrials(daysThreshold: number): Promise<Subscription[]>;
  findRenewingSoon(daysThreshold: number): Promise<Subscription[]>;
  findExpired(): Promise<Subscription[]>;
}
