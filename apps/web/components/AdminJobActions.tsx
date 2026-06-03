"use client";

import { RotateCcw, ShieldX, Wallet } from "lucide-react";
import { useState } from "react";

export function AdminJobActions({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: "retry" | "cancel" | "refund") {
    setLoading(action);
    const response = await fetch(`/api/admin/jobs/${jobId}/${action}`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setLoading(null);

    if (!response.ok) {
      alert(payload.error || `Could not ${action} job.`);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="actions" style={{ marginTop: 0 }}>
      <button className="button" disabled={Boolean(loading)} onClick={() => run("retry")} type="button">
        <RotateCcw size={14} />
        {loading === "retry" ? "Retrying" : "Retry"}
      </button>
      <button className="button" disabled={Boolean(loading)} onClick={() => run("refund")} type="button">
        <Wallet size={14} />
        {loading === "refund" ? "Refunding" : "Refund"}
      </button>
      <button className="button danger" disabled={Boolean(loading)} onClick={() => run("cancel")} type="button">
        <ShieldX size={14} />
        {loading === "cancel" ? "Cancelling" : "Cancel"}
      </button>
    </div>
  );
}
