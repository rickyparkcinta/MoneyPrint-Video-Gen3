import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/SettingsForm"
import { DeleteAccountSection } from "@/components/DeleteAccountSection"
import { mockUser, mockNotificationPreferences } from "@/lib/mock-data"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, notifications, and account",
}

export default async function SettingsPage() {
  // Try to get the real user, fall back to mock for an unconfigured environment.
  let email = mockUser.email
  let name = mockUser.name

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      email = user.email ?? email
      name = (user.user_metadata?.full_name as string | undefined) ?? name
    }
  } catch {
    // Use mock data if Supabase is not configured
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile, notifications, and account.</p>
      </div>

      <div className="space-y-6">
        <SettingsForm
          initialName={name}
          initialEmail={email}
          initialPreferences={mockNotificationPreferences}
        />

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

        <DeleteAccountSection />
      </div>
    </div>
  )
}
