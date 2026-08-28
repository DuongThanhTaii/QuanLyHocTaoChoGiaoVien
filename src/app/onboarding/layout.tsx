import { OnboardingHeader } from '@/components/layout/OnboardingHeader';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <OnboardingHeader />
      <main className="flex-1 flex flex-col relative min-h-0">
        {children}
      </main>
    </div>
  );
}
