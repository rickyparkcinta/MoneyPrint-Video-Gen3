"use client"

import { RotateCcw, ShieldX, Wallet } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function AdminJobActions({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function run(action: "retry" | "cancel" | "refund") {
    setLoading(action)
    const response = await fetch(`/api/admin/jobs/${jobId}/${action}`, { method: "POST" })
    const payload = (await response.json()) as { error?: string }
    setLoading(null)

    if (!response.ok) {
      alert(payload.error || `Could not ${action} job.`)
      return
    }

    window.location.reload()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={Boolean(loading)} onClick={() => run("retry")}>
        <RotateCcw className="size-3.5" />
        {loading === "retry" ? "Retrying" : "Retry"}
      </Button>
      <Button size="sm" variant="outline" disabled={Boolean(loading)} onClick={() => run("refund")}>
        <Wallet className="size-3.5" />
        {loading === "refund" ? "Refunding" : "Refund"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={Boolean(loading)}
        onClick={() => run("cancel")}
      >
        <ShieldX className="size-3.5" />
        {loading === "cancel" ? "Cancelling" : "Cancel"}
      </Button>
    </div>
  )
}
