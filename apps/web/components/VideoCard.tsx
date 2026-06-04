"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/StatusBadge"
import { formatDate, formatDuration } from "@/lib/utils"
import type { Video } from "@/lib/types"
import { Play, Clock } from "lucide-react"
import { useI18n } from "@/components/I18nProvider"

interface VideoCardProps {
  video: Video
}

export function VideoCard({ video }: VideoCardProps) {
  const { locale, dict } = useI18n()
  const isCompleted = video.status === "completed"
  const isProcessing = video.status === "processing"
  const isQueued = video.status === "queued"

  return (
    <Link href={`/videos/${video.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
        {/* Thumbnail / Preview */}
        <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
          {isCompleted && video.thumbnailUrl ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="size-6 translate-x-0.5" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              {isProcessing && (
                <>
                  <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {video.currentStep}
                  </span>
                </>
              )}
              {isQueued && (
                <>
                  <Clock className="size-10 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {dict.videosPage.inQueue}
                  </span>
                </>
              )}
              {video.status === "failed" && (
                <span className="text-sm font-medium text-destructive">
                  {dict.videosPage.generationFailed}
                </span>
              )}
            </div>
          )}
          
          {/* Progress overlay for processing videos */}
          {isProcessing && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3">
              <Progress value={video.progress} className="h-1.5" />
              <span className="mt-1 block text-right text-xs font-medium text-foreground">
                {video.progress}%
              </span>
            </div>
          )}

          {/* Duration badge for completed videos */}
          {isCompleted && video.duration && (
            <div className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
              {video.prompt}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDate(video.createdAt, locale)}
            </span>
            <StatusBadge status={video.status} showIcon={false} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
