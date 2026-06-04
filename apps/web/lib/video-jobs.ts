import type { JobEvent, JobStatus, Video } from "@/lib/types"

type VideoJobRow = {
  id: string
  user_id?: string | null
  topic: string
  status: string
  progress?: number | null
  language?: string | null
  aspect_ratio?: string | null
  duration_seconds?: number | null
  voice_id?: string | null
  subtitle_style?: string | null
  music_style?: string | null
  variants?: number | null
  credit_cost?: number | null
  created_at: string
  completed_at?: string | null
  finished_at?: string | null
  error_message?: string | null
}

type JobEventRow = {
  id: string
  event_type: string
  message?: string | null
  progress?: number | null
  created_at?: string | null
}

const activeStatuses = new Set([
  "processing",
  "dispatching",
  "claimed",
  "generating_script",
  "generating_voice",
  "fetching_assets",
  "generating_subtitles",
  "rendering_video",
  "uploading",
])

const eventLabels: Record<string, string> = {
  queued: "Job queued",
  qstash_published: "Render dispatch queued",
  processing: "Worker processing",
  cloud_run_dispatching: "Legacy dispatching",
  cloud_run_dispatch_failed: "Legacy dispatch failed",
  render_accepted: "Render accepted job",
  claimed: "Worker claimed job",
  generating_script: "Generating script",
  generating_voice: "Generating voice",
  fetching_assets: "Fetching assets",
  generating_subtitles: "Generating subtitles",
  rendering_video: "Rendering video",
  uploading: "Uploading output",
  completed: "Video completed",
  failed: "Job failed",
  refunded: "Credits refunded",
  cancelled: "Job cancelled",
}

export function toUiJobStatus(status: string | null | undefined): JobStatus {
  if (status === "completed") {
    return "completed"
  }
  if (status === "failed" || status === "cancelled" || status === "expired") {
    return "failed"
  }
  if (status === "queued" || !status) {
    return "queued"
  }
  return activeStatuses.has(status) ? "processing" : "processing"
}

export function statusStepLabel(status: string | null | undefined): string {
  if (!status || status === "queued") {
    return "Waiting in queue"
  }
  return eventLabels[status] || humanizeStatus(status)
}

export function mapVideoJobRow(job: VideoJobRow, userId: string, events: JobEvent[] = []): Video {
  const status = toUiJobStatus(job.status)
  const progress = job.progress ?? (status === "completed" ? 100 : status === "queued" ? 0 : 10)

  return {
    id: job.id,
    userId,
    prompt: job.topic,
    status,
    steps: [],
    events,
    currentStep: status === "processing" ? statusStepLabel(job.status) : undefined,
    progress,
    duration: job.duration_seconds ?? undefined,
    createdAt: job.created_at,
    completedAt: job.finished_at ?? job.completed_at ?? undefined,
    error: job.error_message ?? undefined,
    language: languageLabel(job.language),
    aspectRatio: job.aspect_ratio || "9:16",
    voice: job.voice_id || "en-US-JennyNeural-Female",
    subtitleStyle: job.subtitle_style || "bold",
    musicStyle: job.music_style || "none",
    variants: job.variants ?? 1,
    creditCost: job.credit_cost ?? 1,
  }
}

export function mapJobEventRows(events: JobEventRow[]): JobEvent[] {
  return events.map((event) => ({
    id: event.id,
    label: eventLabels[event.event_type] || humanizeStatus(event.event_type),
    status: eventTimelineStatus(event),
    timestamp: event.created_at ?? undefined,
    detail: event.message ?? undefined,
  }))
}

function eventTimelineStatus(event: JobEventRow): JobEvent["status"] {
  if (event.event_type.includes("failed") || event.event_type === "failed") {
    return "failed"
  }
  if (event.event_type === "cancelled") {
    return "failed"
  }
  if ((event.progress ?? 0) >= 100 || event.event_type === "completed") {
    return "completed"
  }
  return "completed"
}

function humanizeStatus(status: string): string {
  return status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function languageLabel(language: string | null | undefined): string {
  return language || "en"
}
