import { createClient } from '@/infrastructure/auth/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { JoinClassCard } from './JoinClassCard';
import { JoinPendingNotice } from './JoinPendingNotice';
import { ClassListClient } from './ClassListClient';

export default async function StudentClassesPage({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  const { join } = await searchParams;

  const { createClient: createAdmin } = require('@supabase/supabase-js');
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: student } = await admin.from('students').select('id').eq('user_id', user.id).maybeSingle();
  const { data: enrollments } = student ? await admin.from('enrollments').select('class_id, status, classes(id, name, subject, description, color)').eq('student_id', student.id).eq('status', 'ACTIVE') : { data: [] };
  const classes = (enrollments || []).map((item: any) => Array.isArray(item.classes) ? item.classes[0] : item.classes).filter(Boolean);

  return (
    <ClassListClient 
      classes={classes} 
      headerAction={<JoinClassCard />}
      notice={join === 'pending' && <JoinPendingNotice />}
    />
  );
}
