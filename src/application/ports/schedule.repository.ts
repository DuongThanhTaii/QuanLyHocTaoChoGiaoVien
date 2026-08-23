import { ScheduleSlot } from '../../domains/schedule/entities/schedule-slot';

export interface IScheduleRepository {
  findById(id: string): Promise<ScheduleSlot | null>;
  findByClassId(classId: string): Promise<ScheduleSlot[]>;
  save(slot: ScheduleSlot): Promise<void>;
  delete(id: string): Promise<void>;
}
