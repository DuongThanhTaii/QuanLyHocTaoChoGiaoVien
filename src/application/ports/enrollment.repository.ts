import { Enrollment } from '../../domains/classroom/entities/enrollment';

export interface IEnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>;
  findByClassId(classId: string): Promise<Enrollment[]>;
  findActiveByClass(classId: string): Promise<Enrollment[]>;
  findByStudentId(studentId: string): Promise<Enrollment[]>;
  save(enrollment: Enrollment): Promise<void>;
}
