import { createClient } from '../../../auth/supabase/server';
import { createRepositories } from './index';

export async function getRepositories() {
  const client = await createClient();
  return createRepositories(client);
}
