import { User } from '../../domains/identity/entities/user';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
  save(user: User): Promise<void>;
  getTeachersWithoutSubscription(): Promise<User[]>;
}
