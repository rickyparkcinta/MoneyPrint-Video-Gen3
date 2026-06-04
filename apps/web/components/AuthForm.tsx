"use client"

import { Mail, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useI18n } from "@/components/I18nProvider"

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const { dict } = useI18n()
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
      setMessage(dict.auth.magicLinkSent)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === "signup" ? dict.auth.createAccount : dict.auth.welcomeBack}
        </CardTitle>
        <CardDescription>
          {mode === "signup"
            ? dict.auth.signupPrompt
            : dict.auth.loginPrompt}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{dict.auth.email}</Label>
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
                {dict.auth.sending}
              </>
            ) : (
              <>
                <Mail />
                {mode === "signup" ? dict.auth.createAccountButton : dict.auth.sendMagicLink}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {dict.auth.magicLinkNote}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
