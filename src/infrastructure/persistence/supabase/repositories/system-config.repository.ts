import { SupabaseClient } from '@supabase/supabase-js';
import { ISystemConfigRepository } from '../../../../application/ports/system-config.repository';

/**
 * System Config Repository
 * Note: This implementation assumes a `system_config` table exists in Supabase:
 * CREATE TABLE system_config (
 *   key TEXT PRIMARY KEY,
 *   value TEXT NOT NULL,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */
export class SupabaseSystemConfigRepository implements ISystemConfigRepository {
  constructor(private readonly client: SupabaseClient) {}

  async get(key: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      throw new Error(`Failed to get system config [${key}]: ${error.message}`);
    }
    
    return data?.value || null;
  }

  async set(key: string, value: string): Promise<void> {
    const { error } = await this.client
      .from('system_config')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      throw new Error(`Failed to set system config [${key}]: ${error.message}`);
    }
  }
}
