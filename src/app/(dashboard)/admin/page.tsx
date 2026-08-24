import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Count teachers
  const { count: teacherCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');
    
  // Count students
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');
    
  // Count trials
  const { count: trialCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'trial');
    
  // Sum revenue this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const { data: revenueData } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('status', 'paid')
    .gte('paid_at', startOfMonth.toISOString());
    
  const monthlyRevenue = (revenueData || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  async function toggleBilling(formData: FormData) {
    'use server';
    // const isEnabled = formData.get('enabled') === 'true';
    console.log('Toggling billing...');
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Tổng - Bảng điều khiển</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Doanh thu hệ thống (Tháng)</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{monthlyRevenue.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Giáo viên Active</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{teacherCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Học sinh Active</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{studentCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm font-semibold uppercase">Gói dùng thử (Trial)</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{trialCount || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Quản lý tính phí hệ thống (SaaS Billing)</h2>
          <form action={toggleBilling}>
            <input type="hidden" name="enabled" value="true" />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
              Bật chế độ Thu Phí
            </button>
          </form>
        </div>
        <p className="text-gray-600 mb-4">
          Khi kích hoạt, hệ thống sẽ tự động chuyển tất cả các tài khoản Giáo viên chưa có gói sang trạng thái <strong>Dùng thử 30 ngày (Trial)</strong>.
        </p>
      </div>
    </div>
  );
}
