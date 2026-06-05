"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ReferralInviteCardProps = {
  code: string
  inviteUrl: string
  labels: {
    inviteCode: string
    inviteLink: string
    copyLink: string
    copied: string
  }
}

export function ReferralInviteCard({ code, inviteUrl, labels }: ReferralInviteCardProps) {
  const [copied, setCopied] = useState(false)

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[11rem_1fr_auto] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="referral-code">{labels.inviteCode}</Label>
        <Input id="referral-code" value={code} readOnly className="font-mono" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="referral-link">{labels.inviteLink}</Label>
        <Input id="referral-link" value={inviteUrl} readOnly className="font-mono text-xs" />
      </div>
      <Button type="button" onClick={copyInviteLink} className="sm:mb-px">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? labels.copied : labels.copyLink}
      </Button>
    </div>
  )
}
