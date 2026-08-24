import { SupabaseClient } from '@supabase/supabase-js';
import { IClassRepository } from '../../../../application/ports/class.repository';
import { Classroom } from '../../../../domains/classroom/entities/class';
import { Money } from '../../../../domains/shared/value-objects';

export class SupabaseClassRepository implements IClassRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Classroom {
    const entity = Object.create(Classroom.prototype);
    Object.assign(entity, {
      _id: row.id,
      _teacherId: row.teacher_id,
      _name: row.name,
      _subject: row.subject,
      _description: row.description,
      _feePerSession: new Money(row.fee_per_session),
      _feeType: row.fee_type,
      _color: row.color,
      _isActive: row.is_active,
      _createdAt: new Date(row.created_at),
    });
    return entity;
  }

  async findById(id: string): Promise<Classroom | null> {
    const { data, error } = await this.client
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find class: ${error.message}`);
    }
    
    if (!data) return null;

    return this.toDomain(data);
  }

  async findByTeacherId(teacherId: string): Promise<Classroom[]> {
    const { data, error } = await this.client
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      throw new Error(`Failed to find classes by teacher ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async save(classroom: Classroom): Promise<void> {
    const c = classroom as any;
    const { error } = await this.client
      .from('classes')
      .upsert({
        id: c._id,
        teacher_id: c._teacherId,
        name: c._name,
        subject: c._subject,
        description: c._description,
        fee_per_session: c._feePerSession.amount,
        fee_type: c._feeType,
        color: c._color,
        is_active: c._isActive,
        created_at: c._createdAt ? c._createdAt.toISOString() : undefined,
      }, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save class: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete class: ${error.message}`);
    }
  }
}
