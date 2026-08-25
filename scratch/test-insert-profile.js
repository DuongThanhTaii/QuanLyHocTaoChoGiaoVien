const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) return console.error('List users error:', userError);
  
  if (users.users.length === 0) return console.log('No users found in auth.users');
  
  const user = users.users[0];
  console.log('Trying to insert profile for user:', user.id);
  
  const { data, error } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: 'Test Name',
    role: 'teacher'
  });
  
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
