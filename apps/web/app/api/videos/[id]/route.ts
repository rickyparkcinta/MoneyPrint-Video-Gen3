import { NextResponse } from "next/server";
import { createSignedOutputUrl } from "@/lib/jobs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view this video job." }, { status: 401 });
  }

  const { data: job, error } = await getSupabaseAdmin()
    .from("video_jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Video job not found." }, { status: 404 });
  }

  return NextResponse.json({
    job,
    outputSignedUrl: await createSignedOutputUrl(job.output_path)
  });
}
