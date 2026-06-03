import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  /** Percentage change vs. previous period. Positive renders green, negative red. */
  change?: number
  hint?: string
}

export function StatCard({ label, value, icon: Icon, change, hint }: StatCardProps) {
  const hasChange = typeof change === "number"
  const isPositive = (change ?? 0) >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {hasChange ? (
          <p
            className={cn(
              "mt-2 flex items-center gap-1 text-xs",
              isPositive ? "text-emerald-400" : "text-destructive"
            )}
          >
            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change!)}% vs last month
          </p>
        ) : hint ? (
          <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
