import { SupabaseClient } from '@supabase/supabase-js';
import { Subscription } from '../../../../domains/subscription/entities/subscription';
import { ISubscriptionRepository } from '../../../../application/ports/subscription.repository';

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Subscription {
    const subscription = Object.create(Subscription.prototype);
    Object.assign(subscription, {
      _id: row.id,
      _teacherId: row.teacher_id,
      _planId: row.plan_id,
      _status: row.status,
      _trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
      _currentPeriodStart: new Date(row.current_period_start),
      _currentPeriodEnd: new Date(row.current_period_end),
      _cancelAtPeriodEnd: row.cancel_at_period_end,
    });
    return subscription;
  }

  async findById(id: string): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find subscription: ${error.message}`);
    }
    
    return this.toDomain(data);
  }

  async findByTeacherId(teacherId: string): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find subscription for teacher: ${error.message}`);
    }

    if (!data) return null;

    return this.toDomain(data);
  }

  async save(subscription: Subscription): Promise<void> {
    const anySub = subscription as any;
    
    const { error } = await this.client
      .from('subscriptions')
      .upsert({
        id: anySub.id || anySub._id,
        teacher_id: anySub.teacherId || anySub._teacherId,
        plan_id: anySub.planId || anySub._planId,
        status: anySub.status || anySub._status,
        trial_ends_at: (anySub.trialEndsAt || anySub._trialEndsAt) ? new Date(anySub.trialEndsAt || anySub._trialEndsAt).toISOString() : null,
        current_period_start: new Date(anySub.currentPeriodStart || anySub._currentPeriodStart).toISOString(),
        current_period_end: new Date(anySub.currentPeriodEnd || anySub._currentPeriodEnd).toISOString(),
        cancel_at_period_end: anySub.cancelAtPeriodEnd || anySub._cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  }

  async findActiveInPeriod(startDate: Date, endDate: Date): Promise<Subscription[]> {
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trial'])
      .lte('current_period_start', endDate.toISOString())
      .gte('current_period_end', startDate.toISOString());

    if (error) {
      throw new Error(`Failed to find active subscriptions: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findExpiringTrials(daysThreshold: number): Promise<Subscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);

    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('status', 'trial')
      .lte('trial_ends_at', targetDate.toISOString())
      .gte('trial_ends_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to find expiring trials: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findRenewingSoon(daysThreshold: number): Promise<Subscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysThreshold);

    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('current_period_end', targetDate.toISOString())
      .gte('current_period_end', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to find renewing subscriptions: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async findExpired(): Promise<Subscription[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .or(`and(status.eq.trial,trial_ends_at.lt.${now}),and(status.eq.active,current_period_end.lt.${now})`);

    if (error) {
      throw new Error(`Failed to find expired subscriptions: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }
}
