import { SupabaseClient } from '@supabase/supabase-js';
import { IAttendanceRepository } from '../../../../application/ports/attendance.repository';
import { AttendanceRecord } from '../../../../domains/attendance/entities/attendance-record';

export class SupabaseAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): AttendanceRecord {
    const entity = Object.create(AttendanceRecord.prototype);
    Object.assign(entity, {
      _id: row.id,
      _slotId: row.slot_id,
      _studentId: row.student_id,
      _classId: row.class_id,
      _status: row.status,
      _note: row.note,
      _markedBy: row.marked_by,
      _markedAt: new Date(row.marked_at),
    });
    return entity;
  }

  async findById(id: string): Promise<AttendanceRecord | null> {
    const { data, error } = await this.client
      .from('attendance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find attendance record: ${error.message}`);
    }
    
    if (!data) return null;

    return this.toDomain(data);
  }

  async findBySlotId(slotId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.client
      .from('attendance_records')
      .select('*')
      .eq('slot_id', slotId);

    if (error) {
      throw new Error(`Failed to find attendance records by slot ID: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async findByStudentAndMonth(studentId: string, classId: string, month: number, year: number): Promise<AttendanceRecord[]> {
    // Determine the start and end dates of the given month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await this.client
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate);

    if (error) {
      throw new Error(`Failed to find attendance records for student in month: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async countSessionsInMonth(classId: string, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const { data, error } = await this.client
      .from('attendance_records')
      .select('slot_id')
      .eq('class_id', classId)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate);

    if (error) {
      throw new Error(`Failed to count sessions in month: ${error.message}`);
    }

    // Count distinct slot_ids
    const slotIds = new Set((data || []).map((row: any) => row.slot_id));
    return slotIds.size;
  }

  async save(record: AttendanceRecord): Promise<void> {
    const r = record as any;
    const { error } = await this.client
      .from('attendance_records')
      .upsert({
        id: r._id,
        slot_id: r._slotId,
        student_id: r._studentId,
        class_id: r._classId,
        status: r._status,
        note: r._note,
        marked_by: r._markedBy,
        marked_at: r._markedAt ? r._markedAt.toISOString() : undefined,
      }, { onConflict: 'slot_id, student_id' });

    if (error) {
      throw new Error(`Failed to save attendance record: ${error.message}`);
    }
  }
}
