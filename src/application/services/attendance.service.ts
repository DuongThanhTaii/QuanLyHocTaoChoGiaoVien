import { IAttendanceRepository } from '../ports/attendance.repository';
import { AttendanceRecord, AttendanceStatus } from '../../domains/attendance/entities/attendance-record';
import { Result } from '../../domains/shared/result';

export class AttendanceService {
  constructor(private attendanceRepo: IAttendanceRepository) {}

  async markAttendance(
    slotId: string,
    studentId: string,
    classId: string,
    status: AttendanceStatus,
    teacherId: string,
    note?: string
  ): Promise<Result<AttendanceRecord>> {
    // Note: Normally we should verify the teacher owns the class, 
    // and the slot belongs to the class, etc.

    const recordResult = AttendanceRecord.mark(
      slotId,
      studentId,
      classId,
      status,
      teacherId,
      note
    );

    if (!recordResult.isSuccess()) {
      return recordResult;
    }

    await this.attendanceRepo.save(recordResult.getValue());
    
    // Domain Events like AttendanceMarkedEvent would be dispatched here 
    // by an EventDispatcher to trigger real-time notifications or chat updates.

    return recordResult;
  }

  async getAttendanceForSlot(slotId: string): Promise<AttendanceRecord[]> {
    return this.attendanceRepo.findBySlotId(slotId);
  }
}
