"use client"

import { useState } from "react"
import { Check, Loader2, Mail, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SettingsFormProps {
  initialName: string
  initialEmail: string
}

export function SettingsForm({ initialName, initialEmail }: SettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [email] = useState(initialEmail)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [error, setError] = useState("")

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSavingProfile(true)
    setSavedProfile(false)
    setError("")

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name }),
    })
    const payload = (await response.json().catch(() => null)) as { error?: string } | null

    setSavingProfile(false)
    if (!response.ok) {
      setError(payload?.error || "Could not save profile.")
      return
    }

    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={saveProfile}>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} readOnly className="pl-10 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Your email is managed by your sign-in provider and can&apos;t be changed here.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="size-4 animate-spin" /> : null}
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
              {savedProfile && (
                <span className="flex items-center gap-1 text-sm text-emerald-400">
                  <Check className="size-4" />
                  Saved
                </span>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
