'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import Image from 'next/image';

export function OnboardingHeader({ className = 'bg-white' }: { className?: string }) {
  const pathname = usePathname();
  
  // Determine current step based on path
  let currentStep = 3;
  let title = "Vai trò của bạn là gì?";
  let subtitle = "Chọn vai trò phù hợp để chúng tôi thiết lập Mari cho bạn.";
  
  if (pathname.includes('/register/verify-email')) {
    currentStep = 2;
    title = "Xác thực Email";
    subtitle = "Vui lòng kiểm tra hộp thư đến của bạn và làm theo hướng dẫn.";
  } else if (pathname.includes('/register')) {
    currentStep = 1;
    title = "Tạo tài khoản mới";
    subtitle = "Bắt đầu hành trình của bạn với Mari ngay hôm nay.";
  } else if (pathname !== '/onboarding') {
    // Nếu không phải trang /onboarding gốc mà là các trang con (VD: /onboarding/teacher)
    currentStep = 4;
    title = "Thông tin cá nhân";
    subtitle = "Hoàn thiện thông tin để bắt đầu sử dụng hệ thống.";
  }

  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Xác thực' },
    { num: 3, label: 'Vai trò' },
    { num: 4, label: 'Thông tin' }
  ];

  return (
    <header className={`relative z-10 flex w-full flex-col items-center justify-center px-6 pb-4 pt-6 ${className}`}>
      <div className="relative mb-4 h-10 w-28 overflow-hidden"><Image src="/images/empty_states/logo_text.webp?v=20260904" alt="Mari" fill sizes="112px" className="object-contain mix-blend-multiply" priority /></div>
      {/* Stepper */}
      <div className="flex items-center w-full max-w-md mb-8">
        {steps.map((step, index) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-3 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isCompleted ? 'bg-[#e86f18] text-white' :
                    isActive ? 'bg-[#e86f18] text-white ring-4 ring-orange-200/70' :
                    'border border-orange-200 bg-white/80 text-orange-300'}`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span className={`text-sm absolute -bottom-7 whitespace-nowrap
                  ${isActive || isCompleted ? 'font-medium text-[#a95123]' : 'text-orange-300'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[1px] flex-1 mx-4 transition-colors
                  ${step.num < currentStep ? 'bg-[#e86f18]' : 'bg-orange-200'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-2">
        <h2 className="mb-3 text-3xl font-extrabold text-[#a95123] md:text-4xl">{title}</h2>
        <p className="text-[#9f745f]">{subtitle}</p>
      </div>
    </header>
  );
}
