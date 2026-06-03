import { NextResponse } from "next/server";
import { canonicalRequestUrl } from "@/lib/env";
import { runMoneyPrintCloudJob } from "@/lib/google/cloud-run";
import { getQstashReceiver } from "@/lib/qstash/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type QstashPayload = {
  job_id?: string;
  user_id?: string;
  attempt?: number;
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("Upstash-Signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing QStash signature." }, { status: 401 });
  }

  const valid = await getQstashReceiver().verify({
    signature,
    body: rawBody,
    url: canonicalRequestUrl(request)
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid QStash signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as QstashPayload;
  if (!payload.job_id || !payload.user_id) {
    return NextResponse.json({ error: "Missing job_id or user_id." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: job, error } = await admin
    .from("video_jobs")
    .select("id,status,user_id")
    .eq("id", payload.job_id)
    .eq("user_id", payload.user_id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (["completed", "failed", "cancelled", "expired"].includes(job.status)) {
    return NextResponse.json({ ok: true, skipped: job.status });
  }

  await admin
    .from("video_jobs")
    .update({ status: "dispatching", updated_at: now })
    .eq("id", payload.job_id)
    .eq("user_id", payload.user_id);

  await admin.from("job_events").insert({
    job_id: payload.job_id,
    user_id: payload.user_id,
    event_type: "cloud_run_dispatching",
    message: `Dispatch attempt ${payload.attempt || 1}.`,
    progress: 1
  });

  try {
    const executionName = await runMoneyPrintCloudJob(payload.job_id, payload.user_id);
    await admin
      .from("video_jobs")
      .update({ cloud_run_execution_id: executionName, updated_at: new Date().toISOString() })
      .eq("id", payload.job_id)
      .eq("user_id", payload.user_id);

    return NextResponse.json({ ok: true, executionName });
  } catch (error) {
    await admin.from("job_events").insert({
      job_id: payload.job_id,
      user_id: payload.user_id,
      event_type: "cloud_run_dispatch_failed",
      message: error instanceof Error ? error.message : "Cloud Run dispatch failed.",
      progress: 1
    });

    return NextResponse.json({ error: "Cloud Run dispatch failed." }, { status: 502 });
  }
}
