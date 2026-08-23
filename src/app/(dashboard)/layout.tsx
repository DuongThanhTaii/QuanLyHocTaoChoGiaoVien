import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  // In a real app, fetch user role from session
  return <DashboardLayout userRole="teacher">{children}</DashboardLayout>;
}
