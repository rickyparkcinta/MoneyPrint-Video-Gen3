export const JOB_STATUSES = [
  "queued",
  "processing",
  "dispatching",
  "claimed",
  "generating_script",
  "generating_voice",
  "fetching_assets",
  "generating_subtitles",
  "rendering_video",
  "uploading",
  "completed",
  "failed",
  "cancelled",
  "expired"
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "queued",
  "processing",
  "dispatching",
  "claimed",
  "generating_script",
  "generating_voice",
  "fetching_assets",
  "generating_subtitles",
  "rendering_video",
  "uploading"
];

export function isTerminalJobStatus(status: string): boolean {
  return ["completed", "failed", "cancelled", "expired"].includes(status);
}
