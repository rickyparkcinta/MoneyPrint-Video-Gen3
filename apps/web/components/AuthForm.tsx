"use client"

import { Lock, Mail, Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { useI18n } from "@/components/I18nProvider"

interface AuthFormProps {
  mode: "login" | "signup"
}

type AuthAction = "password" | "magic"

export function AuthForm({ mode }: AuthFormProps) {
  const { dict } = useI18n()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const [loadingAction, setLoadingAction] = useState<AuthAction | null>(null)
  const isSignup = mode === "signup"
  const loading = loadingAction !== null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoadingAction("password")
    setMessage("")
    setIsError(false)

    const supabase = createSupabaseBrowserClient()
    const { data, error } = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        })

    if (error) {
      setIsError(true)
      setMessage(error.message)
      setLoadingAction(null)
      return
    }

    if (data.session) {
      window.location.assign("/dashboard")
      return
    }

    setMessage(dict.auth.passwordSignupSent)
    setLoadingAction(null)
  }

  async function handleMagicLink() {
    if (!email) {
      setIsError(true)
      setMessage(dict.auth.emailRequired)
      return
    }

    setLoadingAction("magic")
    setMessage("")
    setIsError(false)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: isSignup,
      },
    })

    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else {
      setMessage(dict.auth.magicLinkSent)
    }
    setLoadingAction(null)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isSignup ? dict.auth.createAccount : dict.auth.welcomeBack}
        </CardTitle>
        <CardDescription>
          {isSignup
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

          <div className="space-y-2">
            <Label htmlFor="password">{dict.auth.password}</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
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
            {loadingAction === "password" ? (
              <>
                <Loader2 className="animate-spin" />
                {isSignup ? dict.auth.signingUp : dict.auth.signingIn}
              </>
            ) : (
              <>
                <Lock />
                {isSignup ? dict.auth.createAccountButton : dict.auth.signInWithPassword}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={loading}
            onClick={handleMagicLink}
          >
            {loadingAction === "magic" ? (
              <>
                <Loader2 className="animate-spin" />
                {dict.auth.sending}
              </>
            ) : (
              <>
                <Mail />
                {dict.auth.sendMagicLink}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {isSignup ? dict.auth.passwordSignupNote : dict.auth.passwordLoginNote}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
