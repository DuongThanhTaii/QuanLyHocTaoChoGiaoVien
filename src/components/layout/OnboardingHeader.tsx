'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';

export function OnboardingHeader() {
  const pathname = usePathname();
  
  // Determine current step based on path
  let currentStep = 3;
  let title = "Vai trò của bạn là gì?";
  let subtitle = "Chọn vai trò phù hợp để chúng tôi thiết lập GiaSu Pro cho bạn.";
  
  if (pathname !== '/onboarding') {
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
    <header className="w-full bg-white px-6 pt-8 pb-4 flex flex-col items-center justify-center z-50">
      {/* Stepper */}
      <div className="flex items-center w-full max-w-md mb-8">
        {steps.map((step, index) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-3 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isCompleted ? 'bg-zinc-900 text-white' : 
                    isActive ? 'bg-zinc-900 text-white ring-4 ring-zinc-100' : 
                    'bg-white text-zinc-400 border border-zinc-200'}`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span className={`text-sm absolute -bottom-7 whitespace-nowrap
                  ${isActive || isCompleted ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[1px] flex-1 mx-4 transition-colors
                  ${step.num < currentStep ? 'bg-zinc-900' : 'bg-zinc-200'}`} 
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-2">
        <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-3">{title}</h2>
        <p className="text-zinc-500">{subtitle}</p>
      </div>
    </header>
  );
}
