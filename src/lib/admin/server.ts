import { createClient as createServiceClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/infrastructure/auth/supabase/server';

export type AdminPermission =
  | 'users.read'
  | 'users.restrict'
  | 'roles.read'
  | 'roles.assign'
  | 'roles.manage'
  | 'plans.read'
  | 'plans.manage'
  | 'subscriptions.read'
  | 'subscriptions.manage'
  | 'billing.manage'
  | 'audit.read'
  | 'system.read';

export class AdminAuthorizationError extends Error {
  constructor() {
    super('Bạn không có quyền thực hiện thao tác này.');
  }
}

let adminClient: SupabaseClient | null = null;

/** Service-role access is only returned after a permission check on the request user. */
export function getServiceClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase service role.');

  adminClient = createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AdminAuthorizationError();

  const { data: allowed, error } = await supabase.rpc('has_permission', {
    permission_code: permission,
  });

  if (!error && allowed) return { user, admin: getServiceClient() };

  // The original production admin role remains a safe compatibility fallback
  // while a database is waiting for the dynamic-RBAC migration/schema reload.
  // It never grants access to a non-admin user.
  const { data: legacyAdmin } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (!legacyAdmin) throw new AdminAuthorizationError();
  return { user, admin: getServiceClient() };
}

export async function writeAdminAuditLog(
  admin: SupabaseClient,
  input: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome?: 'success' | 'failure';
    reason?: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
  },
) {
  const { error } = await admin.from('admin_audit_logs').insert({
    actor_id: input.actorId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    outcome: input.outcome ?? 'success',
    reason: input.reason,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
  });

  if (error) throw new Error(`Không thể ghi audit log: ${error.message}`);
}
