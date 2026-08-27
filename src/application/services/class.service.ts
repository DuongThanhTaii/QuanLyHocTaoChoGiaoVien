import { IClassRepository } from '../ports/class.repository';
import { IEnrollmentRepository } from '../ports/enrollment.repository';
import { Classroom, ClassProps } from '../../domains/classroom/entities/class';
import { Enrollment } from '../../domains/classroom/entities/enrollment';
import { Result } from '../../domains/shared/result';
import { Money } from '../../domains/shared/value-objects';

export class ClassService {
  constructor(
    private classRepo: IClassRepository,
    private enrollmentRepo: IEnrollmentRepository
  ) {}

  async createClass(props: ClassProps): Promise<Result<Classroom>> {
    const classroomResult = Classroom.create(props);
    if (!classroomResult.isSuccess()) {
      return classroomResult;
    }

    await this.classRepo.save(classroomResult.getValue());
    return classroomResult;
  }

  async getTeacherClasses(teacherId: string): Promise<Classroom[]> {
    return this.classRepo.findByTeacherId(teacherId);
  }

  async enrollStudent(classId: string, studentId: string, customFeeAmount?: number): Promise<Result<Enrollment>> {
    const classroom = await this.classRepo.findById(classId);
    if (!classroom) {
      return Result.fail(new Error("Class not found"));
    }

    const customFee = customFeeAmount ? new Money(customFeeAmount) : undefined;
    const enrollmentResult = Enrollment.create(classId, studentId, 'ACTIVE', customFee);
    
    if (!enrollmentResult.isSuccess()) {
      return enrollmentResult;
    }

    await this.enrollmentRepo.save(enrollmentResult.getValue());
    return enrollmentResult;
  }
}
