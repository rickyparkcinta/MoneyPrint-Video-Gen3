import { cn, formatDateTime } from "@/lib/utils"
import type { JobEvent } from "@/lib/types"
import { Check, Circle, Loader2, X } from "lucide-react"

interface ProgressTimelineProps {
  events: JobEvent[]
  className?: string
}

/**
 * Vertical timeline of a job's lifecycle events.
 * Renders a connector line between nodes, status-aware node styling,
 * timestamps, and optional detail text.
 */
export function ProgressTimeline({ events, className }: ProgressTimelineProps) {
  return (
    <ol className={cn("relative space-y-6", className)}>
      {events.map((event, index) => {
        const isCompleted = event.status === "completed"
        const isProcessing = event.status === "processing"
        const isFailed = event.status === "failed"
        const isQueued = event.status === "queued"
        const isLast = index === events.length - 1

        return (
          <li key={event.id} className="relative flex gap-4">
            {/* Connector line */}
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%+4px)] w-px -translate-x-1/2",
                  isCompleted ? "bg-primary/40" : "bg-border"
                )}
              />
            )}

            {/* Node */}
            <div
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isProcessing && "border-primary bg-background",
                isFailed && "border-destructive bg-destructive text-destructive-foreground",
                isQueued && "border-border bg-background"
              )}
            >
              {isCompleted && <Check className="size-4" />}
              {isProcessing && <Loader2 className="size-4 animate-spin text-primary" />}
              {isFailed && <X className="size-4" />}
              {isQueued && <Circle className="size-2 fill-muted-foreground/40 text-muted-foreground/40" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isFailed ? "text-destructive" : isQueued ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {event.label}
                </span>
                {event.timestamp && (
                  <time className="text-xs text-muted-foreground" dateTime={event.timestamp}>
                    {formatDateTime(event.timestamp)}
                  </time>
                )}
              </div>
              {event.detail && (
                <p className={cn("mt-1 text-xs", isFailed ? "text-destructive/80" : "text-muted-foreground")}>
                  {event.detail}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
