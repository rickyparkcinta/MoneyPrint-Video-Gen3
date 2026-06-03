"use client"

import { useState } from "react"
import { Check, Loader2, Mail, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { NotificationPreferences } from "@/lib/types"

interface SettingsFormProps {
  initialName: string
  initialEmail: string
  initialPreferences: NotificationPreferences
}

const preferenceMeta: Array<{ key: keyof NotificationPreferences; title: string; description: string }> = [
  { key: "jobCompleted", title: "Video completed", description: "Email me when a video finishes rendering" },
  { key: "jobFailed", title: "Video failed", description: "Email me when a generation fails so I can retry" },
  { key: "weeklyDigest", title: "Weekly digest", description: "A weekly summary of your usage and credits" },
  { key: "productUpdates", title: "Product updates", description: "Occasional news about new features" },
]

export function SettingsForm({ initialName, initialEmail, initialPreferences }: SettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [email] = useState(initialEmail)
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  // Placeholder: real impl updates the Supabase `profiles` row.
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSavingProfile(true)
    setSavedProfile(false)
    await new Promise((r) => setTimeout(r, 700))
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
  }

  function togglePref(key: keyof NotificationPreferences) {
    // Placeholder: real impl persists to Supabase on change.
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
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
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose which emails you&apos;d like to receive</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {preferenceMeta.map((meta, index) => (
            <div
              key={meta.key}
              className={`flex items-center justify-between gap-4 ${index === 0 ? "pb-4" : "py-4"} last:pb-0`}
            >
              <div>
                <Label htmlFor={`pref-${meta.key}`} className="cursor-pointer text-sm font-medium">
                  {meta.title}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
              </div>
              <Switch
                id={`pref-${meta.key}`}
                checked={prefs[meta.key]}
                onCheckedChange={() => togglePref(meta.key)}
                aria-label={meta.title}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
