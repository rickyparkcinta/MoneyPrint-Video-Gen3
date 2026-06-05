import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getRenderDispatchConfigError, getRenderWorkerUrl, publishRenderDispatch } from "@/lib/qstash/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (adminUser.error) {
    return NextResponse.json({ error: adminUser.error }, { status: 403 });
  }

  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { data: job, error } = await admin.from("video_jobs").select("id,user_id,status").eq("id", id).single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.status === "completed") {
    return NextResponse.json({ error: "Completed jobs cannot be retried." }, { status: 400 });
  }

  const dispatchConfigError = getRenderDispatchConfigError();
  if (dispatchConfigError) {
    return NextResponse.json({ error: `Video rendering is not configured: ${dispatchConfigError}.` }, { status: 503 });
  }

  const messageId = await publishRenderDispatch(job.id);
  const renderWorkerUrl = getRenderWorkerUrl();

  await admin
    .from("video_jobs")
    .update({
      status: "queued",
      progress: 0,
      qstash_message_id: messageId,
      render_dispatch_id: messageId,
      render_worker_url: renderWorkerUrl,
      locked_by: null,
      locked_until: null,
      error_code: null,
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  await admin.from("job_events").insert({
    job_id: id,
    user_id: job.user_id,
    event_type: "admin_retry",
    message: `Admin retry published QStash message ${messageId}.`,
    progress: 0
  });

  return NextResponse.json({ ok: true, messageId });
}
