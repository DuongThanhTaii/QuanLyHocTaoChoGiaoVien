import { OnboardingHeader } from '@/components/layout/OnboardingHeader';
import { PublicLightTheme } from '@/components/providers/PublicLightTheme';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicLightTheme>
      <div className="mari-animated-background relative flex min-h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,#fffaf0_0%,#fff1c9_48%,#ffe2b5_100%)]">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-20 size-80 rounded-full bg-orange-300/25 blur-3xl" />
        <OnboardingHeader className="bg-transparent" />
        <main className="relative z-10 flex min-h-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </PublicLightTheme>
  );
}
