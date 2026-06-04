import { calculateCreditCost } from "./pricing";

export const VIDEO_DURATIONS = [30, 60] as const;
export const VIDEO_ASPECT_RATIOS = ["9:16", "16:9", "1:1"] as const;
export const VIDEO_LANGUAGES = ["en", "es", "fr", "de", "zh", "ja"] as const;
export const VIDEO_SOURCES = ["pexels", "pixabay", "local"] as const;
export const VIDEO_SCENE_COUNTS = [1, 2, 3, 4, 5, 6] as const;

export type CreateVideoInput = {
  topic: string;
  prompt?: string;
  language: (typeof VIDEO_LANGUAGES)[number];
  aspectRatio: (typeof VIDEO_ASPECT_RATIOS)[number];
  videoSource: (typeof VIDEO_SOURCES)[number];
  durationSeconds: 30 | 60;
  sceneCount: (typeof VIDEO_SCENE_COUNTS)[number];
  voiceId?: string;
  ttsProvider?: string;
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
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (topic.length < 3 || topic.length > 240) {
    return { ok: false, error: "Topic must be between 3 and 240 characters." };
  }

  if (prompt.length > 2000) {
    return { ok: false, error: "Prompt must be 2,000 characters or fewer." };
  }

  const durationSeconds = Number(body.durationSeconds || 30);
  if (!VIDEO_DURATIONS.includes(durationSeconds as 30 | 60)) {
    return { ok: false, error: "Duration must be 30 or 60 seconds." };
  }

  const sceneCount = Number(body.sceneCount || (durationSeconds <= 30 ? 3 : 5));
  if (!VIDEO_SCENE_COUNTS.includes(sceneCount as CreateVideoInput["sceneCount"])) {
    return { ok: false, error: "Scene count must be between 1 and 6." };
  }

  const language = typeof body.language === "string" ? body.language : "en";
  if (!VIDEO_LANGUAGES.includes(language as CreateVideoInput["language"])) {
    return { ok: false, error: "Unsupported language." };
  }

  const aspectRatio = typeof body.aspectRatio === "string" ? body.aspectRatio : "9:16";
  if (!VIDEO_ASPECT_RATIOS.includes(aspectRatio as CreateVideoInput["aspectRatio"])) {
    return { ok: false, error: "Unsupported aspect ratio." };
  }

  const videoSource = typeof body.videoSource === "string" ? body.videoSource : "pexels";
  if (!VIDEO_SOURCES.includes(videoSource as CreateVideoInput["videoSource"])) {
    return { ok: false, error: "Unsupported video source." };
  }

  const value: CreateVideoInput = {
    topic,
    prompt,
    language: language as CreateVideoInput["language"],
    aspectRatio: aspectRatio as CreateVideoInput["aspectRatio"],
    videoSource: videoSource as CreateVideoInput["videoSource"],
    durationSeconds: durationSeconds as 30 | 60,
    sceneCount: sceneCount as CreateVideoInput["sceneCount"],
    voiceId: typeof body.voiceId === "string" ? body.voiceId : "en-US-JennyNeural-Female",
    ttsProvider: typeof body.ttsProvider === "string" ? body.ttsProvider.slice(0, 64) : "edge",
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
