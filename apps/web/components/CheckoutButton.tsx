"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

export function CheckoutButton({ planId, label }: { planId: string; label: string }) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId })
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setLoading(false);

    if (payload.url) {
      window.location.href = payload.url;
      return;
    }

    alert(payload.error || "Could not start checkout.");
  }

  return (
    <button className="button primary" disabled={loading} onClick={checkout} type="button">
      <CreditCard size={16} />
      {loading ? "Opening..." : label}
    </button>
  );
}
