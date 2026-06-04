import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/SettingsForm"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { getI18n } from "@/lib/i18n-server"
import type { Dictionary } from "@/lib/i18n"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, notifications, and account",
}

export default async function SettingsPage() {
  const { dict } = await getI18n()
  let email = ""
  let name = ""

  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return <AuthRequired dict={dict} />
    }

    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .single()

    email = user.email ?? profile?.email ?? ""
    name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || ""
  } catch {
    return <SettingsUnavailable dict={dict} />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dict.settings.title}</h1>
        <p className="mt-1 text-muted-foreground">{dict.settings.subtitle}</p>
      </div>

      <div className="space-y-6">
        <SettingsForm initialName={name} initialEmail={email} />

        {/* Billing quick link */}
        <Card>
          <CardHeader>
            <CardTitle>{dict.common.billing}</CardTitle>
            <CardDescription>{dict.settings.billingDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/billing">
                {dict.settings.goBilling}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AuthRequired({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mb-2">{dict.settings.authTitle}</CardTitle>
          <CardDescription className="mb-6">
            {dict.settings.authDescription}
          </CardDescription>
          <Button asChild>
            <Link href="/login">{dict.common.login}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsUnavailable({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CardTitle className="mb-2">{dict.settings.unavailableTitle}</CardTitle>
          <CardDescription>
            {dict.settings.unavailableDescription}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
