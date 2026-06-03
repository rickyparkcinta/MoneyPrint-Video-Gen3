"use client";

import { Settings } from "lucide-react";
import { useState } from "react";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const response = await fetch("/api/stripe/customer-portal", { method: "POST" });
    const payload = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (payload.url) {
      window.location.href = payload.url;
      return;
    }

    alert(payload.error || "Could not open the billing portal.");
  }

  return (
    <button className="button" disabled={loading} onClick={openPortal} type="button">
      <Settings size={16} />
      {loading ? "Opening..." : "Manage billing"}
    </button>
  );
}
