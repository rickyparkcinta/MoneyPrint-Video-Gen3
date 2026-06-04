"use client"

import { Settings } from "lucide-react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useI18n } from "@/components/I18nProvider"

interface PortalButtonProps {
  label?: string
  variant?: ButtonProps["variant"]
  className?: string
}

export function PortalButton({ label, variant = "outline", className }: PortalButtonProps) {
  const { dict } = useI18n()
  const [loading, setLoading] = useState(false)
  const resolvedLabel = label ?? dict.buttons.manageBilling

  async function openPortal() {
    setLoading(true)
    const response = await fetch("/api/stripe/customer-portal", { method: "POST" })
    const payload = (await response.json()) as { url?: string; error?: string }
    setLoading(false)

    if (payload.url) {
      window.location.href = payload.url
      return
    }

    alert(payload.error || dict.buttons.portalError)
  }

  return (
    <Button variant={variant} className={className} disabled={loading} onClick={openPortal} type="button">
      <Settings className="size-4" />
      {loading ? dict.buttons.opening : resolvedLabel}
    </Button>
  )
}
