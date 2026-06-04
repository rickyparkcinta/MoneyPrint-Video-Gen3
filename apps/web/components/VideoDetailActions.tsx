"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Download, RefreshCw, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Video } from "@/lib/types"
import { useI18n } from "@/components/I18nProvider"

interface VideoDetailActionsProps {
  video: Pick<
    Video,
    "id" | "status" | "prompt" | "language" | "aspectRatio" | "voice" | "subtitleStyle" | "musicStyle" | "variants" | "duration"
  >
  outputUrl?: string | null
}

export function VideoDetailActions({ video, outputUrl }: VideoDetailActionsProps) {
  const { dict } = useI18n()
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState("")

  const isCompleted = video.status === "completed"
  const isFailed = video.status === "failed"

  // Pre-fill the create form with this job's settings ("Duplicate settings").
  function duplicateSettings() {
    const params = new URLSearchParams()
    params.set("topic", video.prompt)
    if (video.language) params.set("language", video.language)
    if (video.aspectRatio) params.set("aspectRatio", video.aspectRatio)
    if (video.duration) params.set("duration", String(video.duration))
    if (video.voice) params.set("voice", video.voice)
    if (video.subtitleStyle) params.set("subtitle", video.subtitleStyle)
    if (video.musicStyle) params.set("music", video.musicStyle)
    if (video.variants) params.set("variants", String(video.variants))
    router.push(`/create?${params.toString()}`)
  }

  async function regenerate() {
    setPending("regenerate")
    setError("")

    const response = await fetch("/api/videos/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: video.prompt,
        durationSeconds: video.duration === 60 ? 60 : 30,
        voiceId: video.voice,
        subtitleStyle: video.subtitleStyle,
        musicStyle: video.musicStyle,
        variants: 1,
      }),
    })
    const payload = (await response.json().catch(() => null)) as { jobId?: string; error?: string } | null

    setPending(null)
    if (!response.ok || !payload?.jobId) {
      setError(payload?.error || dict.videoDetail.actions.queueError)
      return
    }

    router.push(`/videos/${payload.jobId}`)
  }

  function share() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {isCompleted && outputUrl && (
        <Button asChild>
          <a href={outputUrl} download>
            <Download />
            {dict.videoDetail.actions.download}
          </a>
        </Button>
      )}

      {(isCompleted || isFailed) && (
        <Button variant={isFailed ? "default" : "outline"} onClick={regenerate} disabled={pending === "regenerate"}>
          <RefreshCw className={pending === "regenerate" ? "animate-spin" : undefined} />
          {isFailed ? dict.videoDetail.actions.retry : dict.videoDetail.actions.regenerate}
        </Button>
      )}

      <Button variant="outline" onClick={duplicateSettings}>
        <Copy />
        {dict.videoDetail.actions.duplicate}
      </Button>

      {isCompleted && (
        <Button variant="outline" onClick={share}>
          <Share2 />
          {dict.videoDetail.actions.share}
        </Button>
      )}

      {error && <p className="basis-full text-sm text-destructive">{error}</p>}
    </div>
  )
}
