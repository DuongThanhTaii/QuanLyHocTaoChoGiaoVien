require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const payload = {
    id: 'e10f607c-3f59-4f51-b8f4-6a8b792b0051',
    invoice_number: 'HD-202608-1234',
    teacher_id: 'b05f69c4-2963-4baf-b1b4-d8531a6fb2ab',
    student_id: '23f70877-6dc0-46a8-a90c-d882a6fdc7ed',
    class_id: '724134bb-7bea-4ed4-bef4-651c446aad13',
    period_start: '2026-08-01T00:00:00Z',
    period_end: '2026-08-31T23:59:59Z',
    sessions_count: 2,
    subtotal: 300000,
    discount: 0,
    total_amount: 300000,
    status: 'draft',
    due_date: '2026-09-10T00:00:00Z',
    notes: '{}'
  };
  console.log("Inserting...", payload);
  const res = await supabase.from('invoices').insert(payload);
  console.log("Result:", res.error ? res.error : "Success");
}
run();
