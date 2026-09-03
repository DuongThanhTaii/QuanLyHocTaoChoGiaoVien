import { requireAdminPermission } from './server';

function isMissingAdminTable(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST205' || error?.message?.includes("Could not find the table 'public.");
}

async function optionalAdminRows<T>(query: PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>) {
  const result = await query;
  if (!result.error) return result.data ?? [];
  if (isMissingAdminTable(result.error)) return [];
  throw new Error(result.error.message ?? 'Không thể đọc dữ liệu quản trị.');
}

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  profileStatus: string | null;
  primaryRole: string | null;
  roles: string[];
  createdAt: string;
  lastSignInAt: string | null;
  restriction: { id: string; type: string; reason: string; endsAt: string | null } | null;
};

export async function getAdminUsers(search = ''): Promise<AdminUserRow[]> {
  const { admin } = await requireAdminPermission('users.read');
  const [authResult, profilesResult, primaryRolesResult, roleAssignments, restrictions] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('profiles').select('id, full_name, status'),
    admin.from('user_roles').select('user_id, role').eq('is_primary', true),
    optionalAdminRows(admin.from('user_role_assignments').select('user_id, roles!user_role_assignments_role_id_fkey(code)').is('revoked_at', null)),
    optionalAdminRows(admin.from('account_restrictions').select('id, user_id, type, reason, ends_at').is('revoked_at', null)),
  ]);

  if (authResult.error) throw new Error(`Không thể đọc tài khoản Auth: ${authResult.error.message}`);
  for (const result of [profilesResult, primaryRolesResult]) {
    if (result.error) throw new Error(`Không thể đọc dữ liệu người dùng: ${result.error.message}`);
  }

  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const primaryRoles = new Map((primaryRolesResult.data ?? []).map((role) => [role.user_id, role.role]));
  const dynamicRoles = new Map<string, string[]>();
  for (const assignment of roleAssignments) {
    const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
    if (!role?.code) continue;
    dynamicRoles.set(assignment.user_id, [...(dynamicRoles.get(assignment.user_id) ?? []), role.code]);
  }
  const activeRestrictions = new Map(restrictions.map((restriction) => [restriction.user_id, {
    id: restriction.id, type: restriction.type, reason: restriction.reason, endsAt: restriction.ends_at,
  }]));

  const normalizedSearch = search.trim().toLowerCase();
  return (authResult.data.users ?? []).map((user) => {
    const profile = profiles.get(user.id);
    return {
      id: user.id,
      email: user.email ?? 'Không có email',
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? 'Chưa có hồ sơ',
      profileStatus: profile?.status ?? null,
      primaryRole: primaryRoles.get(user.id) ?? null,
      roles: dynamicRoles.get(user.id) ?? [],
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      restriction: activeRestrictions.get(user.id) ?? null,
    };
  }).filter((user) => !normalizedSearch || user.email.toLowerCase().includes(normalizedSearch) || user.fullName.toLowerCase().includes(normalizedSearch));
}
