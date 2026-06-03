import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requiredEnv } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return adminClient;
}
