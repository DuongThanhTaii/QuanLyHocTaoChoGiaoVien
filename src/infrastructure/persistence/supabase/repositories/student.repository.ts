import { SupabaseClient } from '@supabase/supabase-js';

export interface StudentData {
  id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  school: string | null;
  note: string | null;
  created_at: string;
}

export class SupabaseStudentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<StudentData | null> {
    const { data, error } = await this.client
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find student: ${error.message}`);
    }
    
    return data;
  }

  async findByUserId(userId: string): Promise<StudentData | null> {
    const { data, error } = await this.client
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find student by user_id: ${error.message}`);
    }
    
    return data;
  }

  async findByPhoneOrEmail(search: string): Promise<StudentData[]> {
    const { data, error } = await this.client
      .from('students')
      .select('*')
      .or(`phone.eq.${search},email.eq.${search}`);

    if (error) {
      throw new Error(`Failed to search student: ${error.message}`);
    }
    
    return data || [];
  }

  async create(student: Partial<StudentData>): Promise<StudentData> {
    const { data, error } = await this.client
      .from('students')
      .insert([student])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }
    
    return data;
  }

  async update(id: string, student: Partial<StudentData>): Promise<StudentData> {
    const { data, error } = await this.client
      .from('students')
      .update(student)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }
    
    return data;
  }
}
