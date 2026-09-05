import { PublicLightTheme } from "@/components/providers/PublicLightTheme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicLightTheme>{children}</PublicLightTheme>;
}
