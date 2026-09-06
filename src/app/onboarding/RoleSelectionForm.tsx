'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RoleSelectionForm() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

  const handleNext = () => {
    if (selectedRole) {
      router.push(`/onboarding/${selectedRole}`);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-start p-4 md:p-6 w-full max-w-6xl mx-auto h-full">
      
      <div className="grid w-full gap-5 md:grid-cols-3 md:gap-6">
        {/* Card Giáo viên */}
        <div 
          onClick={() => setSelectedRole('teacher')}
          className={`relative group flex flex-col items-center rounded-2xl border-2 bg-white/95 p-6 shadow-[0_12px_26px_rgba(137,77,33,0.14)] backdrop-blur transition-all duration-300 ease-out cursor-pointer
            ${selectedRole === 'teacher' ? 'border-[#ef7616] -translate-y-1' : 'border-white/90 hover:-translate-y-1 hover:border-orange-200'}`}
        >
          {selectedRole === 'teacher' && (
            <div className="absolute -right-3 -top-3 z-20 rounded-full bg-[#ef7616] p-1.5 text-white shadow-sm transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/teacher_colored.jpg" alt="Teacher" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-[#a95123] transition-colors md:text-2xl">Giáo viên / Gia sư</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Quản lý lớp học, học sinh, lịch dạy, học phí và bài tập.
            </p>
          </div>
        </div>

        {/* Card Học sinh */}
        <div 
          onClick={() => setSelectedRole('student')}
          className={`relative group flex flex-col items-center rounded-2xl border-2 bg-white/95 p-6 shadow-[0_12px_26px_rgba(137,77,33,0.14)] backdrop-blur transition-all duration-300 ease-out cursor-pointer
            ${selectedRole === 'student' ? 'border-[#ef7616] -translate-y-1' : 'border-white/90 hover:-translate-y-1 hover:border-orange-200'}`}
        >
          {selectedRole === 'student' && (
            <div className="absolute -right-3 -top-3 z-20 rounded-full bg-[#ef7616] p-1.5 text-white shadow-sm transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/student_colored.jpg" alt="Student" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-[#a95123] transition-colors md:text-2xl">Học sinh</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Xem lịch học, bài tập, bài giảng và theo dõi tiến độ.
            </p>
          </div>
        </div>

        {/* Card Phụ huynh */}
        <div 
          onClick={() => setSelectedRole('guardian')}
          className={`relative group flex flex-col items-center rounded-2xl border-2 bg-white/95 p-6 shadow-[0_12px_26px_rgba(137,77,33,0.14)] backdrop-blur transition-all duration-300 ease-out cursor-pointer
            ${selectedRole === 'guardian' ? 'border-[#ef7616] -translate-y-1' : 'border-white/90 hover:-translate-y-1 hover:border-orange-200'}`}
        >
          {selectedRole === 'guardian' && (
            <div className="absolute -right-3 -top-3 z-20 rounded-full bg-[#ef7616] p-1.5 text-white shadow-sm transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/parent_colored.jpg" alt="Parent" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="mb-2 text-xl font-bold text-[#a95123] transition-colors md:text-2xl">Phụ huynh</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Theo dõi quá trình học tập, lịch học và học phí của con.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full justify-end pt-6">
        <Button 
          onClick={handleNext}
          disabled={!selectedRole}
          size="lg"
          className="h-11 rounded-full bg-gradient-to-b from-[#ff981b] to-[#f26808] px-8 text-base font-semibold text-white shadow-[0_5px_0_#d95508,0_8px_14px_rgba(217,85,8,0.3)] hover:brightness-105"
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  );
}
