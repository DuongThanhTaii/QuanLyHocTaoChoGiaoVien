import { Plan } from '../../domains/subscription/entities/plan';

export interface IPlanRepository {
  findById(id: string): Promise<Plan | null>;
  findAllActive(): Promise<Plan[]>;
  save(plan: Plan): Promise<void>;
}
