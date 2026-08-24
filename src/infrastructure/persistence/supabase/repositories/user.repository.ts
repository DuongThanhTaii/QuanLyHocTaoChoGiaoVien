import { SupabaseClient } from '@supabase/supabase-js';
import { IUserRepository } from '../../../../application/ports/user.repository';
import { User } from '../../../../domains/identity/entities/user';
import { Email } from '../../../../domains/shared/value-objects';

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  private toDomain(row: any): User {
    const entity = Object.create(User.prototype);
    Object.assign(entity, {
      _id: row.id,
      _email: new Email(row.email),
      _fullName: row.full_name,
      _phone: row.phone,
      _avatarUrl: row.avatar_url,
      _role: row.role,
      _timezone: row.timezone,
      _createdAt: new Date(row.created_at),
      _updatedAt: new Date(row.updated_at),
    });
    return entity;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }
    
    if (!data) return null;

    return this.toDomain(data);
  }

  async findByRole(role: string): Promise<User[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('role', role);

    if (error) {
      throw new Error(`Failed to find users by role: ${error.message}`);
    }

    return (data || []).map(row => this.toDomain(row));
  }

  async save(user: User): Promise<void> {
    const u = user as any;
    const { error } = await this.client
      .from('profiles')
      .upsert({
        id: u._id,
        email: u._email.value,
        full_name: u._fullName,
        phone: u._phone,
        avatar_url: u._avatarUrl,
        role: u._role,
        timezone: u._timezone,
        created_at: u._createdAt ? u._createdAt.toISOString() : undefined,
        updated_at: u._updatedAt ? u._updatedAt.toISOString() : undefined,
      });

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async getTeachersWithoutSubscription(): Promise<User[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select(`
        *,
        subscriptions!left (id)
      `)
      .eq('role', 'teacher');

    if (error) {
      throw new Error(`Failed to fetch teachers without subscription: ${error.message}`);
    }

    // Filter teachers who have no subscriptions
    const teachersWithoutSubs = (data || []).filter((row: any) => !row.subscriptions || row.subscriptions.length === 0);
    return teachersWithoutSubs.map(row => this.toDomain(row));
  }
}
