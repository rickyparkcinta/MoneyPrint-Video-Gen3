import { NextResponse } from "next/server";
import { createSignedOutputUrl, readStorageText } from "@/lib/jobs";
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

  const { data: events } = await getSupabaseAdmin()
    .from("job_events")
    .select("*")
    .eq("job_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const [outputSignedUrl, script, subtitles] = await Promise.all([
    createSignedOutputUrl(job.output_path),
    readStorageText(job.script_path),
    readStorageText(job.subtitles_path)
  ]);

  return NextResponse.json({
    job,
    events: events ?? [],
    outputSignedUrl,
    script,
    subtitles
  });
}
