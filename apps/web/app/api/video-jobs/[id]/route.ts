import { NextResponse } from "next/server";
import { createSignedOutputUrl } from "@/lib/jobs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { toUiJobStatus } from "@/lib/video-jobs";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to view this video job." }, { status: 401 });
  }

  const { data: job, error } = await getSupabaseAdmin()
    .from("video_jobs")
    .select("id,user_id,status,progress,output_bucket,output_path,output_url,error_message,created_at,updated_at,started_at,finished_at,completed_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Video job not found." }, { status: 404 });
  }

  const signedOutputUrl = job.output_url || await createSignedOutputUrl(job.output_path, job.output_bucket);

  return NextResponse.json({
    id: job.id,
    status: toUiJobStatus(job.status),
    progress: job.progress ?? 0,
    output_url: signedOutputUrl,
    error_message: job.error_message,
    created_at: job.created_at,
    updated_at: job.updated_at,
    started_at: job.started_at,
    finished_at: job.finished_at ?? job.completed_at
  });
}
