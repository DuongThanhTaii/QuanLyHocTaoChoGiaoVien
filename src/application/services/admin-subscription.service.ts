import { ISubscriptionRepository } from '../ports/subscription.repository';
import { IPlanRepository } from '../ports/plan.repository';
import { ISystemConfigRepository } from '../ports/system-config.repository';
import { IUserRepository } from '../ports/user.repository';
import { Result } from '../../domains/shared/result';
import { Subscription } from '../../domains/subscription/entities/subscription';
import { Money } from '../../domains/shared/value-objects';

export class SubscriptionAdminService {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private planRepo: IPlanRepository,
    private configRepo: ISystemConfigRepository,
    private userRepo: IUserRepository
  ) {}

  async toggleBillingMode(adminId: string, enabled: boolean): Promise<Result<void>> {
    const adminUser = await this.userRepo.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return Result.fail(new Error("Unauthorized: Only admins can toggle billing"));
    }

    await this.configRepo.set('BILLING_ENABLED', enabled.toString());
    
    if (enabled) {
      // Find default pro plan
      const plans = await this.planRepo.findAllActive();
      const proPlan = plans.find(p => p.id === 'plan_pro_monthly'); // In real app, might query by specific attribute
      const planId = proPlan ? proPlan.id : 'plan_pro_monthly';

      const teachers = await this.userRepo.getTeachersWithoutSubscription();
      
      for (const teacher of teachers) {
        const trial = Subscription.createTrial(teacher.id, planId, 30);
        await this.subscriptionRepo.save(trial);
      }
    }
    
    return Result.ok(undefined);
  }

  async updatePlanPricing(
    adminId: string, 
    planId: string, 
    monthlyPrice: number,
    yearlyPrice: number
  ): Promise<Result<void>> {
    const adminUser = await this.userRepo.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return Result.fail(new Error("Unauthorized: Only admins can update pricing"));
    }

    const plan = await this.planRepo.findById(planId);
    if (!plan) return Result.fail(new Error("Plan not found"));
    
    if (monthlyPrice > 0 && monthlyPrice < 50000) {
      return Result.fail(new Error("Price too low, minimum is 50000 VND"));
    }
    
    plan.updatePricing(new Money(monthlyPrice), new Money(yearlyPrice));
    await this.planRepo.save(plan);
    
    return Result.ok(undefined);
  }
}
