import { SupabaseClient } from '@supabase/supabase-js';
import { IScheduleRepository } from '../../../../application/ports/schedule.repository';
import { ScheduleSlot } from '../../../../domains/schedule/entities/schedule-slot';

export class SupabaseScheduleRepository implements IScheduleRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): ScheduleSlot {
    const entity = Object.create(ScheduleSlot.prototype);
    Object.assign(entity, {
      _id: row.id,
      _classId: row.class_id,
      _title: row.title,
      _dayOfWeek: row.day_of_week,
      _startTime: row.start_time,
      _endTime: row.end_time,
      _room: row.room,
      _isRecurring: row.is_recurring,
      _specificDate: row.specific_date ? new Date(row.specific_date) : null,
    });
    return entity;
  }

  async findById(id: string): Promise<ScheduleSlot | null> {
    const { data, error } = await this.client
      .from('schedule_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find schedule slot: ${error.message}`);
    }
    
    if (!data) return null;

    return this.toDomain(data);
  }

  async findByClassId(classId: string): Promise<ScheduleSlot[]> {
    const { data, error } = await this.client
      .from('schedule_slots')
      .select('*')
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Failed to find schedule slots by class ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async save(slot: ScheduleSlot): Promise<void> {
    const s = slot as any;
    const { error } = await this.client
      .from('schedule_slots')
      .upsert({
        id: s._id,
        class_id: s._classId,
        title: s._title,
        day_of_week: s._dayOfWeek,
        start_time: s._startTime,
        end_time: s._endTime,
        room: s._room,
        is_recurring: s._isRecurring,
        specific_date: s._specificDate ? s._specificDate.toISOString() : null,
      }, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save schedule slot: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('schedule_slots')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete schedule slot: ${error.message}`);
    }
  }
}
