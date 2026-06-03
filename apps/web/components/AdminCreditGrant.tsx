"use client"

import { Gift } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminCreditGrant() {
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState(5)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const response = await fetch("/api/admin/credits/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount }),
    })
    const payload = (await response.json()) as { error?: string }
    setLoading(false)
    setIsError(!response.ok)
    setMessage(response.ok ? `Granted ${amount} credits.` : payload.error || "Credit grant failed.")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjust user credits</CardTitle>
        <CardDescription>Grant credits to a user by their Supabase ID</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="admin-user-id">User ID</Label>
            <Input
              id="admin-user-id"
              required
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="user_xxxxxxxx"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-credit-amount">Amount</Label>
            <Input
              id="admin-credit-amount"
              min={1}
              required
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          {message ? (
            <p className={isError ? "text-sm text-destructive" : "text-sm text-emerald-400"}>{message}</p>
          ) : null}
          <Button disabled={loading} type="submit">
            <Gift className="size-4" />
            {loading ? "Granting..." : "Grant credits"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
