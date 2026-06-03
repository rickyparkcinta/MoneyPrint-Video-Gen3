import { calculateCreditCost } from "./pricing";

export const VIDEO_DURATIONS = [30, 60] as const;
export const VIDEO_ASPECT_RATIOS = ["9:16"] as const;
export const VIDEO_LANGUAGES = ["en"] as const;

export type CreateVideoInput = {
  topic: string;
  prompt?: string;
  language: "en";
  aspectRatio: "9:16";
  durationSeconds: 30 | 60;
  voiceId?: string;
  subtitleStyle?: string;
  musicStyle?: string;
  variants: 1;
};

export type CreateVideoValidation =
  | { ok: true; value: CreateVideoInput; creditCost: number }
  | { ok: false; error: string };

export function validateCreateVideoInput(input: unknown): CreateVideoValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const body = input as Record<string, unknown>;
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (topic.length < 3 || topic.length > 240) {
    return { ok: false, error: "Topic must be between 3 and 240 characters." };
  }

  const durationSeconds = Number(body.durationSeconds || 30);
  if (!VIDEO_DURATIONS.includes(durationSeconds as 30 | 60)) {
    return { ok: false, error: "Duration must be 30 or 60 seconds." };
  }

  const value: CreateVideoInput = {
    topic,
    prompt: typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "",
    language: "en",
    aspectRatio: "9:16",
    durationSeconds: durationSeconds as 30 | 60,
    voiceId: typeof body.voiceId === "string" ? body.voiceId : "en-US-JennyNeural-Female",
    subtitleStyle: typeof body.subtitleStyle === "string" ? body.subtitleStyle : "bold",
    musicStyle: typeof body.musicStyle === "string" ? body.musicStyle : "none",
    variants: 1
  };

  return {
    ok: true,
    value,
    creditCost: calculateCreditCost(value.durationSeconds, value.variants)
  };
}
