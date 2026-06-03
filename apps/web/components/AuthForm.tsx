"use client"

import { Mail, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    setIsError(false)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: mode === "signup",
      },
    })

    setLoading(false)
    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else {
      setMessage("Check your email for the magic link.")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </CardTitle>
        <CardDescription>
          {mode === "signup"
            ? "Enter your email to get started with MoneyPrint"
            : "Enter your email to sign in to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                isError
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-primary/50 bg-primary/10 text-primary"
              }`}
            >
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                <Mail />
                {mode === "signup" ? "Create account" : "Send magic link"}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            We&apos;ll send you a magic link to sign in. No password needed.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
