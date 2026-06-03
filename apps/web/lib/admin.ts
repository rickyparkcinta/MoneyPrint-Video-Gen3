import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function requireAdmin() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return { user: null, error: "Authentication required." };
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { user: null, error: "Admin access required." };
  }

  return { user, error: null };
}
