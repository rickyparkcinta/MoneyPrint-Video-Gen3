import { cn } from "@/lib/utils"
import type { JobStep } from "@/lib/types"
import { Check, Circle, Loader2 } from "lucide-react"

interface JobProgressStepsProps {
  steps: JobStep[]
  className?: string
}

export function JobProgressSteps({ steps, className }: JobProgressStepsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => {
        const isCompleted = step.status === "completed"
        const isProcessing = step.status === "processing"
        const isFailed = step.status === "failed"
        const isQueued = step.status === "queued"

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step indicator */}
            <div className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              isCompleted && "border-primary bg-primary text-primary-foreground",
              isProcessing && "border-primary",
              isFailed && "border-destructive bg-destructive text-destructive-foreground",
              isQueued && "border-muted-foreground/30"
            )}>
              {isCompleted && <Check className="size-3.5" />}
              {isProcessing && <Loader2 className="size-3.5 animate-spin text-primary" />}
              {isFailed && <span className="text-xs font-bold">!</span>}
              {isQueued && <Circle className="size-2 text-muted-foreground/50" />}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-foreground",
                  isProcessing && "text-foreground",
                  isFailed && "text-destructive",
                  isQueued && "text-muted-foreground"
                )}>
                  {step.name}
                </span>
                {isProcessing && step.progress !== undefined && (
                  <span className="text-xs font-medium text-primary">
                    {step.progress}%
                  </span>
                )}
              </div>
              
              {/* Progress bar for processing step */}
              {isProcessing && step.progress !== undefined && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              )}

              {/* Error message */}
              {isFailed && step.message && (
                <p className="mt-1 text-xs text-destructive">
                  {step.message}
                </p>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-3 top-6 h-full w-0.5 -translate-x-1/2 bg-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}
