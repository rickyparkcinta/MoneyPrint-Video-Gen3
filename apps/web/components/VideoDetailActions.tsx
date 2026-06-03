"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Download, RefreshCw, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Video } from "@/lib/types"

interface VideoDetailActionsProps {
  video: Pick<
    Video,
    "id" | "status" | "prompt" | "language" | "aspectRatio" | "voice" | "subtitleStyle" | "musicStyle" | "variants"
  >
  outputUrl?: string | null
}

/**
 * Action bar for a single video job. All handlers are placeholders that
 * simulate the eventual Supabase / QStash wiring — see lib/jobs.ts.
 */
export function VideoDetailActions({ video, outputUrl }: VideoDetailActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  const isCompleted = video.status === "completed"
  const isFailed = video.status === "failed"

  // Pre-fill the create form with this job's settings ("Duplicate settings").
  function duplicateSettings() {
    const params = new URLSearchParams()
    params.set("topic", video.prompt)
    if (video.language) params.set("language", video.language)
    if (video.aspectRatio) params.set("aspectRatio", video.aspectRatio)
    if (video.voice) params.set("voice", video.voice)
    if (video.subtitleStyle) params.set("subtitle", video.subtitleStyle)
    if (video.musicStyle) params.set("music", video.musicStyle)
    if (video.variants) params.set("variants", String(video.variants))
    router.push(`/create?${params.toString()}`)
  }

  // Placeholder: real impl re-enqueues the job via /api/videos/create + QStash.
  async function regenerate() {
    setPending("regenerate")
    await new Promise((r) => setTimeout(r, 600))
    setPending(null)
    router.push("/videos/mock-job-id")
  }

  function share() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {isCompleted && (
        <Button asChild>
          <a href={outputUrl || "#"} download>
            <Download />
            Download Video
          </a>
        </Button>
      )}

      {(isCompleted || isFailed) && (
        <Button variant={isFailed ? "default" : "outline"} onClick={regenerate} disabled={pending === "regenerate"}>
          <RefreshCw className={pending === "regenerate" ? "animate-spin" : undefined} />
          {isFailed ? "Retry Generation" : "Regenerate"}
        </Button>
      )}

      <Button variant="outline" onClick={duplicateSettings}>
        <Copy />
        Duplicate Settings
      </Button>

      {isCompleted && (
        <Button variant="outline" onClick={share}>
          <Share2 />
          Share
        </Button>
      )}

      <Button
        variant="outline"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => router.push("/videos")}
      >
        <Trash2 />
        Delete
      </Button>
    </div>
  )
}
