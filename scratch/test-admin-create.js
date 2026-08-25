const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin_test_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin Test',
      role: 'teacher'
    }
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
