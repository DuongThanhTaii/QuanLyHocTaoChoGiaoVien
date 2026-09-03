import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminAuthorizationError, requireAdminPermission } from '@/lib/admin/server';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try { await requireAdminPermission('system.read'); }
  catch (error) { if (error instanceof AdminAuthorizationError) redirect('/dashboard'); throw error; }

  return children;
}
