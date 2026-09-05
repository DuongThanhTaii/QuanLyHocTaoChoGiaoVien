import { type LoggedInUser } from "@/components/landing/navbar";
import { createClient } from "@/infrastructure/auth/supabase/server";

export async function getCurrentLandingUser(): Promise<LoggedInUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: roleData }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("is_primary", true).single(),
  ]);

  const role = roleData?.role || "teacher";
  const dashboardUrl = role === "admin" ? "/admin" : role === "student" ? "/student" : role === "parent" ? "/parent" : "/teacher";
  const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Người dùng";

  return {
    id: user.id,
    email: user.email,
    name,
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    role,
    dashboardUrl,
  };
}
