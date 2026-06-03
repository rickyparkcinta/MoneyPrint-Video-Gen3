import { validateCreateVideoInput } from "@moneyprint/shared";
import { NextResponse } from "next/server";
import { publishRenderDispatch } from "@/lib/qstash/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    p_credit_cost: creditCost
  });

  if (error || !data?.job_id) {
    return NextResponse.json(
      { error: error?.message || "Unable to create job. Check credits and try again." },
      { status: error?.message?.toLowerCase().includes("insufficient") ? 402 : 400 }
    );
  }

  try {
    const messageId = await publishRenderDispatch(data.job_id, user.id);
    await admin
      .from("video_jobs")
      .update({ qstash_message_id: messageId, updated_at: new Date().toISOString() })
      .eq("id", data.job_id)
      .eq("user_id", user.id);

    await admin.from("job_events").insert({
      job_id: data.job_id,
      user_id: user.id,
      event_type: "qstash_published",
      message: `QStash message ${messageId} published.`,
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

  return NextResponse.json({ jobId: data.job_id, creditCost });
}
