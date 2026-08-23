import { AttendanceRecord } from '../../domains/attendance/entities/attendance-record';

export interface IAttendanceRepository {
  findById(id: string): Promise<AttendanceRecord | null>;
  findBySlotId(slotId: string): Promise<AttendanceRecord[]>;
  findByStudentAndMonth(studentId: string, classId: string, month: number, year: number): Promise<AttendanceRecord[]>;
  countSessionsInMonth(classId: string, month: number, year: number): Promise<number>;
  save(record: AttendanceRecord): Promise<void>;
}
