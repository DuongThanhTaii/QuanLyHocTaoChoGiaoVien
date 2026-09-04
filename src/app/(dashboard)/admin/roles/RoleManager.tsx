'use client';

import { useActionState } from 'react';
import { Plus, ShieldCheck, UserRoundPlus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ActiveRoleAssignment, AdminPermissionRecord, AdminRoleRecord, AssignableAdminUser } from '@/lib/admin/roles';
import { assignRole, createRole, revokeRole, type RoleActionState } from './actions';

const initialState: RoleActionState = {};

function ActionMessage({ state }: { state: RoleActionState }) {
  if (state.error) return <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{state.success}</p>;
  return null;
}

export function RoleManager({
  roles,
  permissions,
  users,
  assignments,
  canAssign,
  canManage,
}: {
  roles: AdminRoleRecord[];
  permissions: AdminPermissionRecord[];
  users: AssignableAdminUser[];
  assignments: ActiveRoleAssignment[];
  canAssign: boolean;
  canManage: boolean;
}) {
  const permissionsByModule = permissions.reduce((groups, permission) => {
    groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
    return groups;
  }, new Map<string, AdminPermissionRecord[]>());
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Vai trò trong hệ thống</CardTitle><CardDescription>{roles.length} vai trò lấy trực tiếp từ database.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => <div key={role.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{role.name}</p><code className="text-[11px] text-muted-foreground">{role.code}</code></div>{role.isSystem ? <Badge><ShieldCheck className="mr-1 size-3" />Hệ thống</Badge> : <Badge variant="secondary">Tùy chỉnh</Badge>}</div>
              <p className="mt-1 text-xs text-muted-foreground">{role.description || 'Chưa có mô tả.'}</p>
              <p className="mt-2 text-xs font-medium">{role.permissions.length} quyền {role.isActive ? '' : '• Đã ngừng hoạt động'}</p>
            </div>)}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Danh mục quyền</CardTitle><CardDescription>Quyền đang được API kiểm tra bằng hàm `has_permission` trong database.</CardDescription></CardHeader>
          <CardContent><div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[.8fr_1fr_1.1fr] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Nhóm</span><span>Quyền</span><span>Mã</span></div>{permissions.map((permission) => <div key={permission.id} className="grid grid-cols-[.8fr_1fr_1.1fr] gap-3 border-b px-4 py-3 text-sm last:border-0"><span>{permission.module}</span><span>{permission.name}</span><code className="text-xs text-muted-foreground">{permission.code}</code></div>)}</div></CardContent>
        </Card>
      </div>

      {canManage && <CreateRoleForm permissionsByModule={permissionsByModule} />}
      {canAssign && <AssignRoleForm users={users} roles={roles.filter((role) => role.isActive)} />}

      <Card>
        <CardHeader><CardTitle>Vai trò đang được cấp</CardTitle><CardDescription>Mọi thay đổi đều ghi vào audit log. Không thể tự cấp hoặc tự thu hồi quyền.</CardDescription></CardHeader>
        <CardContent><div className="overflow-hidden rounded-md border"><div className="grid grid-cols-[1.2fr_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground"><span>Người dùng</span><span>Vai trò</span><span>Thao tác</span></div>{assignments.length ? assignments.map((assignment) => <div key={assignment.id} className="grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 border-b px-4 py-3 text-sm last:border-0"><div className="min-w-0"><p className="truncate font-medium">{assignment.userName}</p><p className="truncate text-xs text-muted-foreground">{assignment.userEmail}</p></div><div><p>{assignment.roleName}</p><code className="text-[11px] text-muted-foreground">{assignment.roleCode}</code></div>{canAssign ? <RevokeRoleForm assignmentId={assignment.id} /> : <span className="text-xs text-muted-foreground">Chỉ xem</span>}</div>) : <div className="px-4 py-5 text-sm text-muted-foreground">Chưa có vai trò quản trị động nào được cấp.</div>}</div></CardContent>
      </Card>
    </div>
  );
}

function CreateRoleForm({ permissionsByModule }: { permissionsByModule: Map<string, AdminPermissionRecord[]> }) {
  const [state, action, isPending] = useActionState(createRole, initialState);
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5" />Tạo vai trò tùy chỉnh</CardTitle><CardDescription>Chỉ Super admin có thể tạo role mới. Mã role không thể sửa sau khi tạo.</CardDescription></CardHeader><CardContent><form action={action} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input name="name" required maxLength={100} placeholder="Tên vai trò, ví dụ: Quản lý học vụ" /><Input name="code" required pattern="[a-z][a-z0-9_]{1,63}" maxLength={64} placeholder="ma_vai_tro" /><Input name="description" maxLength={500} className="sm:col-span-2" placeholder="Mô tả trách nhiệm" /></div><fieldset><legend className="mb-2 text-sm font-medium">Quyền được cấp</legend><div className="grid gap-3 md:grid-cols-2">{[...permissionsByModule.entries()].map(([module, modulePermissions]) => <div key={module} className="rounded-md border p-3"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{module}</p>{modulePermissions.map((permission) => <label key={permission.id} className="flex cursor-pointer items-start gap-2 py-1.5 text-sm"><input type="checkbox" name="permissionIds" value={permission.id} className="mt-0.5" /><span>{permission.name}<code className="ml-2 text-[11px] text-muted-foreground">{permission.code}</code></span></label>)}</div>)}</div></fieldset><ActionMessage state={state} /><Button disabled={isPending}>{isPending ? 'Đang tạo...' : 'Tạo vai trò'}</Button></form></CardContent></Card>;
}

function AssignRoleForm({ users, roles }: { users: AssignableAdminUser[]; roles: AdminRoleRecord[] }) {
  const [state, action, isPending] = useActionState(assignRole, initialState);
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRoundPlus className="size-5" />Gán vai trò</CardTitle><CardDescription>Bạn chỉ có thể gán hoặc thu hồi role mà các quyền của nó không vượt quá quyền của mình.</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><select name="userId" required defaultValue="" className="h-10 min-w-0 rounded-md border bg-background px-3 text-sm"><option value="" disabled>Chọn người dùng</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} — {user.email}</option>)}</select><select name="roleId" required defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="" disabled>Chọn vai trò</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><Input name="reason" maxLength={500} placeholder="Lý do (không bắt buộc)" /><Button disabled={isPending}>{isPending ? 'Đang gán...' : 'Gán vai trò'}</Button><div className="md:col-span-4"><ActionMessage state={state} /></div></form></CardContent></Card>;
}

function RevokeRoleForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, isPending] = useActionState(revokeRole, initialState);
  return <form action={action} className="flex justify-end gap-2"><input type="hidden" name="assignmentId" value={assignmentId} /><Button type="submit" size="sm" variant="outline" disabled={isPending}><X className="mr-1 size-3.5" />Thu hồi</Button>{state.error && <span className="sr-only" role="alert">{state.error}</span>}</form>;
}
