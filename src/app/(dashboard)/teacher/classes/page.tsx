import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Users, PlusCircle } from 'lucide-react';
import { getRepositories } from '@/infrastructure/persistence/supabase/repositories/get-repositories';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { ClassListClient } from './ClassListClient';

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const repos = await getRepositories();
  const classes = await repos.classes.findByTeacherId(user.id);

  // Fetch enrollment counts
  const classesWithCounts = await Promise.all(
    classes.map(async (c: any) => {
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', c.id)
        .is('left_at', null);
        
      return {
        id: c.id,
        name: c.name,
        subject: (c as any)._subject,
        color: (c as any)._color,
        feeAmount: c.feePerSession.amount,
        studentsCount: count || 0
      };
    })
  );

  return (
    <div className="space-y-6">
      <ClassListClient classes={classesWithCounts} />
    </div>
  );
}
