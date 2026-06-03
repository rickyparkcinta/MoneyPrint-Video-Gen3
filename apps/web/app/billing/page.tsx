import type { Metadata } from "next"
import Link from "next/link"
import { CreditCard, Coins, Calendar, ArrowUpRight, Receipt } from "lucide-react"
import { CREDIT_PACK } from "@moneyprint/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckoutButton } from "@/components/CheckoutButton"
import { PortalButton } from "@/components/PortalButton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { mockUser, mockSubscription, mockTransactions, mockPlans } from "@/lib/mock-data"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your subscription and billing",
}

export default async function BillingPage() {
  // Try to get real data, fall back to mock
  let credits = mockUser.credits
  let subscription = mockSubscription

  try {
    const { user } = await getAuthenticatedUser()
    if (user) {
      const [{ data: balance }, { data: subscriptions }] = await Promise.all([
        getSupabaseAdmin().from("credit_balances").select("balance").eq("user_id", user.id).single(),
        getSupabaseAdmin()
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])
      credits = balance?.balance ?? mockUser.credits
      if (subscriptions && subscriptions[0]) {
        subscription = {
          ...mockSubscription,
          status: subscriptions[0].status,
        }
      }
    }
  } catch {
    // Use mock data if Supabase is not configured
  }

  const currentPlan = mockPlans.find((p) => p.id === mockUser.plan) || mockPlans[1]
  const creditUsagePercent = (credits / currentPlan.credits) * 100
  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription, credits, and payment methods
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Credits
            </CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits}</div>
            <div className="mt-2">
              <Progress value={Math.min(creditUsagePercent, 100)} className="h-1.5" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {credits} of {currentPlan.credits} credits used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Plan
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{currentPlan.name}</span>
              <Badge variant={subscription.status === "active" ? "success" : "secondary"}>
                {subscription.status}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatCurrency(currentPlan.price)}/month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Billing Date
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{daysUntilRenewal}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              days until {formatDate(subscription.currentPeriodEnd)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your current plan and billing preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{currentPlan.name} Plan</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlan.credits} videos per month • {formatCurrency(currentPlan.price)}/month
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Renews on {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/pricing">
                  Change Plan
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
              <PortalButton label="Open customer portal" />
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                Cancel Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Cards are securely managed through Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2027</p>
              </div>
            </div>
            <PortalButton label="Update payment method" />
          </div>
        </CardContent>
      </Card>

      {/* Buy credits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Need More Credits?</CardTitle>
          <CardDescription>Top up your account with a one-time credit pack</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{CREDIT_PACK.name}</p>
              <p className="text-sm text-muted-foreground">
                {CREDIT_PACK.credits} additional credits, charged once
              </p>
            </div>
            <CheckoutButton planId={CREDIT_PACK.id} label="Buy Credits" />
          </div>
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent billing activity</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Receipt className="size-4" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "purchase"
                          ? "default"
                          : transaction.type === "refund"
                          ? "success"
                          : "secondary"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        transaction.credits > 0
                          ? "text-primary"
                          : transaction.credits < 0
                          ? "text-muted-foreground"
                          : ""
                      }
                    >
                      {transaction.credits > 0 ? "+" : ""}
                      {transaction.credits}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.amount > 0 ? formatCurrency(transaction.amount) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
