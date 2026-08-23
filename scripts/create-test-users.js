require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const usersToCreate = [
  { email: 'duongthanhtaihs@test.com', password: '123456', role: 'student', name: 'Học sinh Thành Tài' },
  { email: 'duongthanhtaigv@test.com', password: '123456', role: 'teacher', name: 'Giáo viên Thành Tài' },
  { email: 'duongthanhtaiph@test.com', password: '123456', role: 'parent', name: 'Phụ huynh Thành Tài' },
  { email: 'duongthanhtaiadmin@test.com', password: '123456', role: 'admin', name: 'Admin Thành Tài' }
];

async function seedUsers() {
  console.log("Bat dau tao users...");
  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.name,
        role: u.role
      }
    });

    if (error) {
      console.error(`Loi khi tao user ${u.email}:`, error.message);
    } else {
      console.log(`Tao thanh cong user: ${u.email} (Role: ${u.role})`);
    }
  }
  console.log("Hoan tat!");
}

seedUsers();
