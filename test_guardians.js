require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const {data: guardians} = await supabase.from('guardians').select('*');
  const {data: links} = await supabase.from('student_guardians').select('*');
  console.log('Guardians:', guardians);
  console.log('Links:', links);
}
run();
