require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: enrollments } = await supabase.from('enrollments').select('*').eq('class_id', '724134bb-7bea-4ed4-bef4-651c446aad13');
  console.log("ENROLLMENTS:", JSON.stringify(enrollments, null, 2));
}
run();
