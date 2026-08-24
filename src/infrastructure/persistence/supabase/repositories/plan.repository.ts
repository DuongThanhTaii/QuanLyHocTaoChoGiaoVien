import { SupabaseClient } from '@supabase/supabase-js';
import { Plan } from '../../../../domains/subscription/entities/plan';
import { Money } from '../../../../domains/shared/value-objects';
import { IPlanRepository } from '../../../../application/ports/plan.repository';

export class SupabasePlanRepository implements IPlanRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Plan {
    return new Plan(
      row.id,
      row.name,
      row.description,
      new Money(Number(row.price_monthly)),
      new Money(Number(row.price_yearly)),
      row.features,
      row.is_active
    );
  }

  async findById(id: string): Promise<Plan | null> {
    const { data, error } = await this.client
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to find plan: ${error.message}`);
    }
    
    return this.toDomain(data);
  }

  async findAllActive(): Promise<Plan[]> {
    const { data, error } = await this.client
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      throw new Error(`Failed to find active plans: ${error.message}`);
    }

    return data.map(row => this.toDomain(row));
  }

  async save(plan: Plan): Promise<void> {
    const anyPlan = plan as any;
    
    const { error } = await this.client
      .from('plans')
      .upsert({
        id: anyPlan.id || anyPlan._id,
        name: anyPlan.name || anyPlan._name,
        description: anyPlan.description || anyPlan._description,
        price_monthly: (anyPlan.priceMonthly || anyPlan._priceMonthly).amount,
        price_yearly: (anyPlan.priceYearly || anyPlan._priceYearly).amount,
        features: anyPlan.features || anyPlan._features,
        is_active: anyPlan.isActive || anyPlan._isActive,
      });

    if (error) {
      throw new Error(`Failed to save plan: ${error.message}`);
    }
  }
}
