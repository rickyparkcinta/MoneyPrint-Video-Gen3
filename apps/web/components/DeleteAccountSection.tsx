"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const CONFIRM_PHRASE = "DELETE"

export function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Placeholder: real impl calls a server action that revokes Stripe,
  // deletes Supabase data, and signs the user out.
  async function deleteAccount() {
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 900))
    setDeleting(false)
    alert("This is a placeholder. Account deletion will be wired to Supabase + Stripe.")
    setConfirming(false)
    setPhrase("")
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-destructive" />
          <CardTitle className="text-destructive">Delete account</CardTitle>
        </div>
        <CardDescription>
          Permanently delete your account, videos, and billing history. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!confirming ? (
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
            Delete my account
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-mono font-semibold text-destructive">{CONFIRM_PHRASE}</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                disabled={phrase !== CONFIRM_PHRASE || deleting}
                onClick={deleteAccount}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {deleting ? "Deleting..." : "Permanently delete"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirming(false)
                  setPhrase("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
