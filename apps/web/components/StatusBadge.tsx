import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { JobStatus } from "@/lib/types"
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react"

interface StatusBadgeProps {
  status: JobStatus
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<JobStatus, { 
  label: string
  variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info"
  icon: React.ComponentType<{ className?: string }>
}> = {
  queued: { 
    label: "Queued", 
    variant: "secondary",
    icon: Clock
  },
  processing: { 
    label: "Processing", 
    variant: "info",
    icon: Loader2
  },
  completed: { 
    label: "Completed", 
    variant: "success",
    icon: CheckCircle
  },
  failed: { 
    label: "Failed", 
    variant: "destructive",
    icon: XCircle
  },
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      {showIcon && (
        <Icon className={cn(
          "size-3",
          status === "processing" && "animate-spin"
        )} />
      )}
      {config.label}
    </Badge>
  )
}
