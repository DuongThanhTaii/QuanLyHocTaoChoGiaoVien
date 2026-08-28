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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
        {/* Card Giáo viên */}
        <div 
          onClick={() => setSelectedRole('teacher')}
          className={`relative group flex flex-col items-center p-6 bg-white rounded-2xl cursor-pointer transition-all duration-300 ease-out
            ${selectedRole === 'teacher' ? 'border-2 border-blue-600 shadow-md' : 'border-2 border-zinc-200 shadow-sm hover:shadow-lg hover:border-blue-300'}`}
        >
          {selectedRole === 'teacher' && (
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1.5 shadow-sm z-20 transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/teacher_colored.jpg" alt="Teacher" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-2 transition-colors">Giáo viên / Gia sư</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Quản lý lớp học, học sinh, lịch dạy, học phí và bài tập.
            </p>
          </div>
        </div>

        {/* Card Học sinh */}
        <div 
          onClick={() => setSelectedRole('student')}
          className={`relative group flex flex-col items-center p-6 bg-white rounded-2xl cursor-pointer transition-all duration-300 ease-out
            ${selectedRole === 'student' ? 'border-2 border-green-600 shadow-md' : 'border-2 border-zinc-200 shadow-sm hover:shadow-lg hover:border-green-300'}`}
        >
          {selectedRole === 'student' && (
            <div className="absolute -top-3 -right-3 bg-green-600 text-white rounded-full p-1.5 shadow-sm z-20 transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/student_colored.jpg" alt="Student" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-green-900 mb-2 transition-colors">Học sinh</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Xem lịch học, bài tập, bài giảng và theo dõi tiến độ.
            </p>
          </div>
        </div>

        {/* Card Phụ huynh */}
        <div 
          onClick={() => setSelectedRole('guardian')}
          className={`relative group flex flex-col items-center p-6 bg-white rounded-2xl cursor-pointer transition-all duration-300 ease-out
            ${selectedRole === 'guardian' ? 'border-2 border-purple-600 shadow-md' : 'border-2 border-zinc-200 shadow-sm hover:shadow-lg hover:border-purple-300'}`}
        >
          {selectedRole === 'guardian' && (
            <div className="absolute -top-3 -right-3 bg-purple-600 text-white rounded-full p-1.5 shadow-sm z-20 transition-all duration-300">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
          )}
          <div className="w-full h-40 md:h-48 relative mb-6 overflow-hidden rounded-lg">
            <Image src="/images/onboarding/parent_colored.jpg" alt="Parent" fill className="object-contain group-hover:scale-105 transition-transform duration-500 ease-out" />
          </div>
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-2 transition-colors">Phụ huynh</h3>
            <p className="text-zinc-500 text-sm leading-relaxed px-2">
              Theo dõi quá trình học tập, lịch học và học phí của con.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-end">
        <Button 
          onClick={handleNext}
          disabled={!selectedRole}
          size="lg"
          className="px-8 text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
        >
          Tiếp theo
        </Button>
      </div>
    </div>
  );
}
