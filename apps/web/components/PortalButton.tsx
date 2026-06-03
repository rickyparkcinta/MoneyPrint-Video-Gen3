"use client"

import { Settings } from "lucide-react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

interface PortalButtonProps {
  label?: string
  variant?: ButtonProps["variant"]
  className?: string
}

export function PortalButton({ label = "Manage billing", variant = "outline", className }: PortalButtonProps) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const response = await fetch("/api/stripe/customer-portal", { method: "POST" })
    const payload = (await response.json()) as { url?: string; error?: string }
    setLoading(false)

    if (payload.url) {
      window.location.href = payload.url
      return
    }

    alert(payload.error || "Could not open the billing portal.")
  }

  return (
    <Button variant={variant} className={className} disabled={loading} onClick={openPortal} type="button">
      <Settings className="size-4" />
      {loading ? "Opening..." : label}
    </Button>
  )
}
