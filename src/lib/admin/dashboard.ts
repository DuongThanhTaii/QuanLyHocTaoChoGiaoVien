import { getServiceClient, requireAdminPermission } from './server';

function isMissingAdminTable(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || error?.message?.includes("Could not find the table 'public.");
}

async function optionalCount(query: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>) {
  const result = await query;
  if (!result.error) return result.count ?? 0;
  if (isMissingAdminTable(result.error)) return 0;
  throw new Error(result.error.message ?? 'Không thể đọc dữ liệu quản trị.');
}

async function optionalRows<T>(query: PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>) {
  const result = await query;
  if (!result.error) return result.data ?? [];
  if (isMissingAdminTable(result.error)) return [];
  throw new Error(result.error.message ?? 'Không thể đọc dữ liệu quản trị.');
}

export async function getAdminDashboard() {
  await requireAdminPermission('system.read');
  const admin = getServiceClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAhead = new Date(now);
  sevenDaysAhead.setDate(now.getDate() + 7);

  const [
    users,
    activeTeachers,
    activeClasses,
    activeEnrollments,
    paidInvoices,
    trialsEndingSoon,
    activeRestrictions,
    recentAudit,
    billingConfig,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('status', 'ACTIVE'),
    admin.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    admin.from('invoices').select('total_amount').eq('status', 'paid').gte('paid_at', thirtyDaysAgo.toISOString()),
    admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trial').gte('trial_ends_at', now.toISOString()).lte('trial_ends_at', sevenDaysAhead.toISOString()),
    optionalCount(admin.from('account_restrictions').select('*', { count: 'exact', head: true }).is('revoked_at', null).lte('starts_at', now.toISOString()).or(`ends_at.is.null,ends_at.gt.${now.toISOString()}`)),
    optionalRows(admin.from('admin_audit_logs').select('id, action, resource_type, resource_id, outcome, created_at, actor:profiles!admin_audit_logs_actor_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(8)),
    admin.from('system_config').select('value').eq('key', 'BILLING_ENABLED').maybeSingle(),
  ]);

  for (const [label, result] of [['người dùng', users], ['giáo viên', activeTeachers], ['lớp học', activeClasses], ['ghi danh', activeEnrollments], ['trial', trialsEndingSoon]] as const) {
    if (result.error) throw new Error(`Không thể đọc ${label}: ${result.error.message}`);
  }
  if (paidInvoices.error) throw new Error(`Không thể đọc hóa đơn: ${paidInvoices.error.message}`);
  if (billingConfig.error) throw new Error(`Không thể đọc cấu hình billing: ${billingConfig.error.message}`);

  const tuitionRevenue30d = (paidInvoices.data ?? []).reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0);

  return {
    users: users.count ?? 0,
    activeTeachers: activeTeachers.count ?? 0,
    activeClasses: activeClasses.count ?? 0,
    activeEnrollments: activeEnrollments.count ?? 0,
    tuitionRevenue30d,
    trialsEndingSoon: trialsEndingSoon.count ?? 0,
    activeRestrictions,
    billingEnabled: billingConfig.data?.value === 'true',
    recentAudit,
  };
}
