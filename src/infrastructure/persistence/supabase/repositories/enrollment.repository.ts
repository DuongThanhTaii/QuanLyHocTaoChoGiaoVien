import { SupabaseClient } from '@supabase/supabase-js';
import { IEnrollmentRepository } from '../../../../application/ports/enrollment.repository';
import { Enrollment } from '../../../../domains/classroom/entities/enrollment';
import { Money } from '../../../../domains/shared/value-objects';

export class SupabaseEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): Enrollment {
    const entity = Object.create(Enrollment.prototype);
    Object.assign(entity, {
      _id: row.id,
      _classId: row.class_id,
      _studentId: row.student_id,
      _status: row.status,
      _enrolledAt: new Date(row.joined_at), // changed from enrolled_at
      _leftAt: row.left_at ? new Date(row.left_at) : null,
      _tuitionPlanId: row.tuition_plan_id,
      _customFee: row.custom_fee !== null ? new Money(row.custom_fee) : null,
    });
    return entity;
  }

  async findById(id: string): Promise<Enrollment | null> {
    const { data, error } = await this.client
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find enrollment: ${error.message}`);
    }
    
    if (!data) return null;

    return this.toDomain(data);
  }

  async findByClassId(classId: string): Promise<Enrollment[]> {
    const { data, error } = await this.client
      .from('enrollments')
      .select('*')
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Failed to find enrollments by class ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async findActiveByClass(classId: string): Promise<Enrollment[]> {
    const { data, error } = await this.client
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('status', 'ACTIVE'); // changed from is null left_at

    if (error) {
      throw new Error(`Failed to find active enrollments by class ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    const { data, error } = await this.client
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to find enrollments by student ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async save(enrollment: Enrollment): Promise<void> {
    const e = enrollment as any;
    const { error } = await this.client
      .from('enrollments')
      .upsert({
        id: e._id,
        class_id: e._classId,
        student_id: e._studentId,
        status: e._status,
        joined_at: e._enrolledAt ? e._enrolledAt.toISOString() : undefined,
        left_at: e._leftAt ? e._leftAt.toISOString() : null,
        tuition_plan_id: e._tuitionPlanId,
        custom_fee: e._customFee ? e._customFee.amount : null,
      }, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save enrollment: ${error.message}`);
    }
  }
}
