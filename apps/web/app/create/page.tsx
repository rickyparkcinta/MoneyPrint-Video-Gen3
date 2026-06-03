import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { CreateVideoForm } from "@/components/CreateVideoForm"
import { Card, CardContent } from "@/components/ui/card"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Create Video",
  description: "Generate a new AI-powered short-form video",
}

export default async function CreatePage() {
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
          Create a New Video
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your video idea and let AI handle the rest.
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
              <p className="text-sm font-medium">Available Credits</p>
              <p className="text-xs text-muted-foreground">
                30 seconds costs 1 credit. 60 seconds costs 2 credits.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">{credits}</span>
            <span className="ml-1 text-sm text-muted-foreground">credits</span>
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
              Sign in before queueing a real render job.
            </p>
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
