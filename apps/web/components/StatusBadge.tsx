"use client"

import { cn } from "@/lib/utils"
import { toUiJobStatus } from "@/lib/video-jobs"
import { Badge } from "@/components/ui/badge"
import type { JobStatus } from "@/lib/types"
import type { ComponentType } from "react"
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import { useI18n } from "@/components/I18nProvider"

interface StatusBadgeProps {
  status: JobStatus | string
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<JobStatus, { 
  variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info"
  icon: ComponentType<{ className?: string }>
}> = {
  queued: { 
    variant: "secondary",
    icon: Clock
  },
  processing: { 
    variant: "info",
    icon: Loader2
  },
  completed: { 
    variant: "success",
    icon: CheckCircle
  },
  failed: { 
    variant: "destructive",
    icon: XCircle
  },
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const { dict } = useI18n()
  const uiStatus = toUiJobStatus(status)
  const config = statusConfig[uiStatus]
  const Icon = config.icon
  const label = {
    queued: dict.common.queued,
    processing: dict.common.processing,
    completed: dict.common.completed,
    failed: dict.common.failed,
  }[uiStatus]

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      {showIcon && (
        <Icon className={cn(
          "size-3",
          uiStatus === "processing" && "animate-spin"
        )} />
      )}
      {label}
    </Badge>
  )
}
