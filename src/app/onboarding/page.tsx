import Link from 'next/link';
import { createClient } from '@/infrastructure/auth/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function OnboardingRoleSelectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col md:flex-row flex-1">
      {/* Cột Giáo viên */}
      <Link href="/onboarding/teacher" className="group relative flex-1 flex flex-col items-center justify-center p-8 bg-blue-50/30 hover:bg-blue-50 transition-colors duration-300 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-200 cursor-pointer">
        <div className="absolute inset-0 flex items-end justify-center pb-10 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
          <Image src="/images/onboarding/teacher.jpg" alt="Teacher" width={400} height={400} className="object-contain" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <h2 className="text-3xl font-bold text-blue-900 mb-4 group-hover:scale-105 transition-transform">Giáo viên / Gia sư</h2>
          <p className="text-blue-700/80">Quản lý lớp học, học sinh, lịch dạy, học phí và bài tập dễ dàng.</p>
        </div>
      </Link>

      {/* Cột Học sinh */}
      <Link href="/onboarding/student" className="group relative flex-1 flex flex-col items-center justify-center p-8 bg-green-50/30 hover:bg-green-50 transition-colors duration-300 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-200 cursor-pointer">
        <div className="absolute inset-0 flex items-end justify-center pb-10 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
          <Image src="/images/onboarding/student.jpg" alt="Student" width={400} height={400} className="object-contain" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <h2 className="text-3xl font-bold text-green-900 mb-4 group-hover:scale-105 transition-transform">Học sinh</h2>
          <p className="text-green-700/80">Xem lịch học, bài tập, bài giảng và theo dõi tiến độ học tập của bản thân.</p>
        </div>
      </Link>

      {/* Cột Phụ huynh */}
      <Link href="/onboarding/guardian" className="group relative flex-1 flex flex-col items-center justify-center p-8 bg-purple-50/30 hover:bg-purple-50 transition-colors duration-300 overflow-hidden cursor-pointer">
        <div className="absolute inset-0 flex items-end justify-center pb-10 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
          <Image src="/images/onboarding/parent.jpg" alt="Parent" width={400} height={400} className="object-contain" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <h2 className="text-3xl font-bold text-purple-900 mb-4 group-hover:scale-105 transition-transform">Phụ huynh</h2>
          <p className="text-purple-700/80">Theo dõi quá trình học tập, lịch học và học phí của con em mình.</p>
        </div>
      </Link>
    </div>
  );
}
