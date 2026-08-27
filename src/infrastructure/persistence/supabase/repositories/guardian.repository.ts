import { SupabaseClient } from '@supabase/supabase-js';

export interface GuardianData {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export class SupabaseGuardianRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<GuardianData | null> {
    const { data, error } = await this.client
      .from('guardians')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find guardian: ${error.message}`);
    }
    
    return data;
  }

  async findByUserId(userId: string): Promise<GuardianData | null> {
    const { data, error } = await this.client
      .from('guardians')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find guardian by user_id: ${error.message}`);
    }
    
    return data;
  }

  async findByPhoneOrEmail(search: string): Promise<GuardianData[]> {
    const { data, error } = await this.client
      .from('guardians')
      .select('*')
      .or(`phone.eq.${search},email.eq.${search}`);

    if (error) {
      throw new Error(`Failed to search guardian: ${error.message}`);
    }
    
    return data || [];
  }

  async create(guardian: Partial<GuardianData>): Promise<GuardianData> {
    const { data, error } = await this.client
      .from('guardians')
      .insert([guardian])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create guardian: ${error.message}`);
    }
    
    return data;
  }

  async linkToStudent(studentId: string, guardianId: string, relationship: string): Promise<void> {
    const { error } = await this.client
      .from('student_guardians')
      .insert([{ student_id: studentId, guardian_id: guardianId, relationship }]);

    if (error) {
      throw new Error(`Failed to link guardian to student: ${error.message}`);
    }
  }

  async getGuardiansForStudent(studentId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('student_guardians')
      .select('*, guardians(*)')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to get guardians for student: ${error.message}`);
    }
    
    return data || [];
  }
}
