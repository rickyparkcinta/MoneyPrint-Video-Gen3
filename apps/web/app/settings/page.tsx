import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/SettingsForm"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, notifications, and account",
}

export default async function SettingsPage() {
  let email = ""
  let name = ""

  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return <AuthRequired />
    }

    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .single()

    email = user.email ?? profile?.email ?? ""
    name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || ""
  } catch {
    return <SettingsUnavailable />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, notifications, and account.</p>
      </div>

      <div className="space-y-6">
        <SettingsForm initialName={name} initialEmail={email} />

        {/* Billing quick link */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your plan, credits, and payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/billing">
                Go to billing
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AuthRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mb-2">Sign in to manage settings</CardTitle>
          <CardDescription className="mb-6">
            Profile settings are tied to your account.
          </CardDescription>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsUnavailable() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mb-2">Settings unavailable</CardTitle>
          <CardDescription>
            The profile service is not available in this deployment.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
