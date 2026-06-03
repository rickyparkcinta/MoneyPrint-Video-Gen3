import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createSignedOutputUrl(outputPath: string | null) {
  if (!outputPath) {
    return null;
  }

  const { data, error } = await getSupabaseAdmin()
    .storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || "videos")
    .createSignedUrl(outputPath, 60 * 15);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
