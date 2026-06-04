import { validateCreateVideoInput } from "@moneyprint/shared";
import { NextResponse } from "next/server";
import { publishRenderDispatch } from "@/lib/qstash/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function createVideoJobFromRequest(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before creating a video." }, { status: 401 });
  }

  const parsed = validateCreateVideoInput(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { value, creditCost } = parsed;
  const input = {
    topic: value.topic,
    prompt: value.prompt,
    aspectRatio: value.aspectRatio,
    language: value.language,
    voiceId: value.voiceId,
    ttsProvider: value.ttsProvider,
    videoSource: value.videoSource,
    durationSeconds: value.durationSeconds,
    sceneCount: value.sceneCount,
    subtitleStyle: value.subtitleStyle,
    musicStyle: value.musicStyle,
    variants: value.variants
  };

  const { data, error } = await admin.rpc("create_video_job_with_credit", {
    p_user_id: user.id,
    p_topic: value.topic,
    p_prompt: value.prompt,
    p_language: value.language,
    p_aspect_ratio: value.aspectRatio,
    p_duration_seconds: value.durationSeconds,
    p_voice_id: value.voiceId,
    p_subtitle_style: value.subtitleStyle,
    p_music_style: value.musicStyle,
    p_variants: value.variants,
    p_credit_cost: creditCost,
    p_input: input
  });

  if (error || !data?.job_id) {
    return NextResponse.json(
      { error: error?.message || "Unable to create job. Check credits and try again." },
      { status: error?.message?.toLowerCase().includes("insufficient") ? 402 : 400 }
    );
  }

  try {
    const messageId = await publishRenderDispatch(data.job_id);
    const renderWorkerUrl = process.env.RENDER_WORKER_URL?.replace(/\/+$/, "");

    await admin
      .from("video_jobs")
      .update({
        qstash_message_id: messageId,
        render_dispatch_id: messageId,
        render_worker_url: renderWorkerUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", data.job_id)
      .eq("user_id", user.id);

    await admin.from("job_events").insert({
      job_id: data.job_id,
      user_id: user.id,
      event_type: "qstash_published",
      message: `QStash message ${messageId} published to Render worker.`,
      progress: 0
    });
  } catch (dispatchError) {
    await admin.rpc("fail_video_job_and_refund", {
      p_job_id: data.job_id,
      p_error_code: "qstash_publish_failed",
      p_error_message: dispatchError instanceof Error ? dispatchError.message : "QStash publish failed"
    });

    return NextResponse.json({ error: "Job was created but dispatch failed. Credits were refunded." }, { status: 502 });
  }

  return NextResponse.json({
    job_id: data.job_id,
    jobId: data.job_id,
    status: "queued",
    creditCost
  });
}
