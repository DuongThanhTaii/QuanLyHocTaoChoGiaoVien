const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test_register_' + Date.now() + '@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User',
        role: 'teacher'
      }
    }
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
