import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';

export default async function OnboardingRoleSelectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // TODO: Check if user has an invitation token in cookie, if yes, skip this page.

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Bạn là ai?</h1>
          <p className="text-zinc-500">
            Chọn vai trò phù hợp để chúng tôi thiết lập GiaSu Pro cho bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RoleCard 
            href="/onboarding/teacher"
            icon={<BookOpen className="w-8 h-8 mb-4 text-blue-600" />}
            title="Giáo viên / Gia sư"
            description="Quản lý lớp học, học sinh, lịch dạy, học phí và bài tập."
          />
          <RoleCard 
            href="/onboarding/student"
            icon={<GraduationCap className="w-8 h-8 mb-4 text-green-600" />}
            title="Học sinh"
            description="Xem lịch học, bài tập, bài giảng và tiến độ học tập."
          />
          <RoleCard 
            href="/onboarding/guardian"
            icon={<Users className="w-8 h-8 mb-4 text-purple-600" />}
            title="Phụ huynh"
            description="Theo dõi quá trình học tập và học phí của con."
          />
        </div>
      </div>
    </div>
  );
}

function RoleCard({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full border-zinc-200 shadow-sm transition-all hover:border-zinc-900 hover:shadow-md cursor-pointer">
        <CardContent className="p-6 flex flex-col items-center text-center">
          {icon}
          <h3 className="font-semibold text-lg mb-2 text-zinc-900 group-hover:text-black">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
