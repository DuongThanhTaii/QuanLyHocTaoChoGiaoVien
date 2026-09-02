import { createClient } from "@/infrastructure/auth/supabase/server";
import { Navbar, LoggedInUser } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { MetricsSection } from "@/components/landing/metrics-section";
import { BentoFeatures } from "@/components/landing/bento-features";
import { ProcessSection } from "@/components/landing/process-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTALampSection } from "@/components/landing/cta-lamp-section";
import { Footer } from "@/components/landing/footer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: LoggedInUser | null = null;

  if (user) {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    // 2. Fetch primary role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();

    const role = roleData?.role || "teacher";

    // 3. Determine dashboard target URL
    const targetDashboardUrl =
      role === "admin"
        ? "/admin"
        : role === "student"
        ? "/student"
        : role === "parent"
        ? "/parent"
        : "/teacher";

    const userName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Người dùng";

    currentUser = {
      id: user.id,
      email: user.email,
      name: userName,
      avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      role,
      dashboardUrl: targetDashboardUrl,
    };
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 overflow-x-hidden">
      {/* Top Header */}
      <Navbar user={currentUser} />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection user={currentUser} />
        <MetricsSection />
        <BentoFeatures />
        <ProcessSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTALampSection user={currentUser} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
