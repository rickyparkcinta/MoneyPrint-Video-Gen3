"use client"

import { CreditCard } from "lucide-react"
import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { useI18n } from "@/components/I18nProvider"

interface CheckoutButtonProps {
  planId: string
  label: string
  variant?: ButtonProps["variant"]
  className?: string
}

export function CheckoutButton({ planId, label, variant = "default", className }: CheckoutButtonProps) {
  const { dict } = useI18n()
  const [loading, setLoading] = useState(false)

  async function checkout() {
    setLoading(true)
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    })
    const payload = (await response.json()) as { url?: string; error?: string }
    setLoading(false)

    if (payload.url) {
      window.location.href = payload.url
      return
    }

    alert(payload.error || dict.buttons.checkoutError)
  }

  return (
    <Button variant={variant} className={className} disabled={loading} onClick={checkout} type="button">
      <CreditCard className="size-4" />
      {loading ? dict.buttons.opening : label}
    </Button>
  )
}
