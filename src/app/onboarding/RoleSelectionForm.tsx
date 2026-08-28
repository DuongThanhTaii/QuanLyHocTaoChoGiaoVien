'use client';

import { useState } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
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
    <div className="flex flex-col flex-1 items-center justify-center p-4 md:p-8 w-full max-w-6xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mb-12">
        {/* Card Giáo viên */}
        <div 
          onClick={() => setSelectedRole('teacher')}
          className={`relative group flex flex-col items-center p-8 bg-white rounded-2xl cursor-pointer transition-all duration-300
            ${selectedRole === 'teacher' ? 'ring-2 ring-blue-600 shadow-md' : 'border border-zinc-200 shadow-sm hover:shadow-md hover:border-blue-300'}`}
        >
          {selectedRole === 'teacher' && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          )}
          <div className="w-full aspect-square relative mb-6">
            <Image src="/images/onboarding/teacher_colored.jpg" alt="Teacher" fill className="object-contain" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-900 mb-3">Giáo viên / Gia sư</h3>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
              Quản lý lớp học, học sinh, lịch dạy, học phí và bài tập dễ dàng.
            </p>
          </div>
        </div>

        {/* Card Học sinh */}
        <div 
          onClick={() => setSelectedRole('student')}
          className={`relative group flex flex-col items-center p-8 bg-white rounded-2xl cursor-pointer transition-all duration-300
            ${selectedRole === 'student' ? 'ring-2 ring-green-600 shadow-md' : 'border border-zinc-200 shadow-sm hover:shadow-md hover:border-green-300'}`}
        >
          {selectedRole === 'student' && (
            <div className="absolute top-4 right-4 bg-green-600 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          )}
          <div className="w-full aspect-square relative mb-6">
            <Image src="/images/onboarding/student_colored.jpg" alt="Student" fill className="object-contain" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-900 mb-3">Học sinh</h3>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
              Xem lịch học, bài tập, bài giảng và theo dõi tiến độ học tập của bản thân.
            </p>
          </div>
        </div>

        {/* Card Phụ huynh */}
        <div 
          onClick={() => setSelectedRole('guardian')}
          className={`relative group flex flex-col items-center p-8 bg-white rounded-2xl cursor-pointer transition-all duration-300
            ${selectedRole === 'guardian' ? 'ring-2 ring-purple-600 shadow-md' : 'border border-zinc-200 shadow-sm hover:shadow-md hover:border-purple-300'}`}
        >
          {selectedRole === 'guardian' && (
            <div className="absolute top-4 right-4 bg-purple-600 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          )}
          <div className="w-full aspect-square relative mb-6">
            <Image src="/images/onboarding/parent_colored.jpg" alt="Parent" fill className="object-contain" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-900 mb-3">Phụ huynh</h3>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
              Theo dõi quá trình học tập, lịch học và học phí của con em mình.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-end mt-4 pb-8">
        <Button 
          onClick={handleNext}
          disabled={!selectedRole}
          size="lg"
          className="px-8 text-base font-semibold"
        >
          Tiếp theo <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
