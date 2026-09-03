import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPermission } from '@/lib/admin/server';

type AuditRow = { id: string; action: string; resource_type: string; resource_id: string | null; outcome: 'success' | 'failure'; reason: string | null; created_at: string; actor: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null };

export default async function LogsPage() {
  const { admin } = await requireAdminPermission('audit.read');
  const { data, error } = await admin.from('admin_audit_logs').select('id, action, resource_type, resource_id, outcome, reason, created_at, actor:profiles!admin_audit_logs_actor_id_fkey(full_name,email)').order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AuditRow[];
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">Nhật ký hệ thống</h1><p className="mt-1 text-sm text-muted-foreground">Lịch sử append-only của các thay đổi quản trị và billing.</p></div><Card><CardHeader><CardTitle>100 sự kiện gần nhất</CardTitle><CardDescription>Không ghi token, mật khẩu hoặc dữ liệu thanh toán thô.</CardDescription></CardHeader><CardContent><div className="divide-y rounded-md border">{rows.length ? rows.map((entry) => { const actor = Array.isArray(entry.actor) ? entry.actor[0] : entry.actor; return <div key={entry.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto]"><div><p className="font-medium">{entry.action}</p><p className="mt-1 text-xs text-muted-foreground">{actor?.full_name || actor?.email || 'Hệ thống'} · {entry.resource_type}{entry.resource_id ? ` · ${entry.resource_id}` : ''} · {new Date(entry.created_at).toLocaleString('vi-VN')}</p>{entry.reason && <p className="mt-1 text-xs text-muted-foreground">Lý do: {entry.reason}</p>}</div><Badge variant={entry.outcome === 'success' ? 'secondary' : 'destructive'} className="w-fit">{entry.outcome === 'success' ? 'Thành công' : 'Thất bại'}</Badge></div>; }) : <p className="p-8 text-center text-sm text-muted-foreground">Chưa có sự kiện quản trị.</p>}</div></CardContent></Card></div>;
}
