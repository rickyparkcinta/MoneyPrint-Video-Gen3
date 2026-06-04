import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { CreateVideoForm } from "@/components/CreateVideoForm"
import { Card, CardContent } from "@/components/ui/card"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { getI18n } from "@/lib/i18n-server"

export const metadata: Metadata = {
  title: "Create Video",
  description: "Generate a new AI-powered short-form video",
}

export default async function CreatePage() {
  const { dict } = await getI18n()
  let credits = 0
  let isAuthenticated = false

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      isAuthenticated = true
      const { data: balance } = await getSupabaseAdmin()
        .from("credit_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single()
      credits = balance?.balance ?? 0
    }
  } catch {
    isAuthenticated = false
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {dict.create.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {dict.create.subtitle}
        </p>
      </div>

      {/* Credit balance indicator */}
      <Card className="mb-8">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Coins className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{dict.create.availableCredits}</p>
              <p className="text-xs text-muted-foreground">
                {dict.create.creditsHelp}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{credits}</span>
            <span className="ml-1 text-sm text-muted-foreground">{dict.common.credits}</span>
          </div>
        </CardContent>
      </Card>

      {/* Create form */}
      {isAuthenticated ? (
        <Suspense fallback={null}>
          <CreateVideoForm />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="mb-6 text-sm text-muted-foreground">
              {dict.create.authMessage}
            </p>
            <Button asChild>
              <Link href="/login">{dict.common.login}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
