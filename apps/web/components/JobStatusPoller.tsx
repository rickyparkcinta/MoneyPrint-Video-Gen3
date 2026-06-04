"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { JobStatus } from "@/lib/types"

type JobStatusResponse = {
  status?: JobStatus
  progress?: number
  output_url?: string | null
  error_message?: string | null
}

export function JobStatusPoller({
  jobId,
  initialStatus,
  initialProgress,
}: {
  jobId: string
  initialStatus: JobStatus
  initialProgress: number
}) {
  const router = useRouter()
  const snapshotRef = useRef(`${initialStatus}:${initialProgress}:`)

  useEffect(() => {
    if (initialStatus === "completed" || initialStatus === "failed") {
      return
    }

    let cancelled = false

    async function poll() {
      try {
        const response = await fetch(`/api/video-jobs/${jobId}`, { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as JobStatusResponse
        const snapshot = `${payload.status}:${payload.progress}:${payload.output_url || payload.error_message || ""}`

        if (snapshot !== snapshotRef.current) {
          snapshotRef.current = snapshot
          router.refresh()
        }

        if (payload.status === "completed" || payload.status === "failed") {
          router.refresh()
          cancelled = true
        }
      } catch {
        // Transient polling failures are retried on the next interval.
      }
    }

    const interval = window.setInterval(() => {
      if (!cancelled) {
        void poll()
      }
    }, 4000)

    void poll()

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [initialProgress, initialStatus, jobId, router])

  return null
}
