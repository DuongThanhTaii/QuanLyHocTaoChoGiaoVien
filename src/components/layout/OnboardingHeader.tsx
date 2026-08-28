'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import Link from 'next/link';

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
    <header className="w-full bg-white border-b border-zinc-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-50">
      <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
        <Link href="/" className="text-2xl font-bold tracking-tight text-zinc-900">
          GiaSu Pro
        </Link>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center max-w-2xl w-full">
        {steps.map((step, index) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isCompleted ? 'bg-zinc-900 text-white' : 
                    isActive ? 'bg-zinc-900 text-white ring-4 ring-zinc-100' : 
                    'bg-zinc-100 text-zinc-400'}`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span className={`text-xs absolute -bottom-5 whitespace-nowrap hidden md:block
                  ${isActive || isCompleted ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[2px] flex-1 mx-2 transition-colors md:mx-4
                  ${step.num < currentStep ? 'bg-zinc-900' : 'bg-zinc-100'}`} 
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full md:w-auto text-center md:text-right hidden md:block">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </header>
  );
}
