import { Classroom } from '../../domains/classroom/entities/class';

export interface IClassRepository {
  findById(id: string): Promise<Classroom | null>;
  findByTeacherId(teacherId: string): Promise<Classroom[]>;
  save(classroom: Classroom): Promise<void>;
  delete(id: string): Promise<void>;
}
