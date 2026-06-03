import type { Metadata } from "next"
import Link from "next/link"
import { BILLING_PLANS, CREDIT_PACK } from "@moneyprint/shared"
import { CreditCard, Coins, Calendar, ArrowUpRight, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckoutButton } from "@/components/CheckoutButton"
import { PortalButton } from "@/components/PortalButton"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your subscription and billing",
}

type SubscriptionRow = {
  plan_id: string | null
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

type CreditTransactionRow = {
  id: string
  amount: number
  type: string
  source: string | null
  video_job_id: string | null
  created_at: string
}

export default async function BillingPage() {
  let credits = 0
  let subscription: SubscriptionRow | null = null
  let transactions: CreditTransactionRow[] = []

  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return <AuthRequired />
    }

    const admin = getSupabaseAdmin()
    const [{ data: balance }, { data: subscriptions }, { data: transactionRows }] = await Promise.all([
      admin.from("credit_balances").select("balance").eq("user_id", user.id).single(),
      admin
        .from("subscriptions")
        .select("plan_id,status,current_period_start,current_period_end,cancel_at_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      admin
        .from("credit_transactions")
        .select("id,amount,type,source,video_job_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
    ])

    credits = balance?.balance ?? 0
    subscription = subscriptions?.[0] ?? null
    transactions = transactionRows ?? []
  } catch {
    return <BillingUnavailable />
  }

  const currentPlan = BILLING_PLANS.find((plan) => plan.id === subscription?.plan_id) || BILLING_PLANS[0]
  const planCreditLimit = Math.max(currentPlan.monthlyCredits, credits, 1)
  const creditUsagePercent = Math.min((credits / planCreditLimit) * 100, 100)
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
  const daysUntilRenewal = periodEnd
    ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null
  const subscriptionStatus = subscription?.status ?? "free"

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Billing & Subscription</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription, credits, and payment methods.
        </p>
      </div>

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
              <Progress value={creditUsagePercent} className="h-1.5" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Current account balance
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
              <Badge variant={subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "success" : "secondary"}>
                {subscriptionStatus}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatCurrency(currentPlan.priceUsd * 100)}/month
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
            <div className="text-3xl font-bold">{daysUntilRenewal ?? "-"}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {periodEnd ? `days until ${formatDate(periodEnd)}` : "No paid subscription on file"}
            </p>
          </CardContent>
        </Card>
      </div>

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
                <Badge variant={subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "success" : "secondary"}>
                  {subscriptionStatus}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentPlan.monthlyCredits} credits per month · {formatCurrency(currentPlan.priceUsd * 100)}/month
              </p>
              {periodEnd && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {subscription?.cancel_at_period_end ? "Ends" : "Renews"} on {formatDate(periodEnd)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/pricing">
                  Change Plan
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
              <PortalButton label="Open customer portal" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Cards and invoices are managed through Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Stripe billing portal</p>
                <p className="text-sm text-muted-foreground">View payment methods, invoices, and subscription changes in Stripe.</p>
              </div>
            </div>
            <PortalButton label="Manage in Stripe" />
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Your recent credit grants, deductions, and refunds</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transactionDescription(transaction)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "grant"
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
                          transaction.amount > 0
                            ? "text-primary"
                            : transaction.amount < 0
                              ? "text-muted-foreground"
                              : ""
                        }
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <Receipt className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No credit transactions yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function transactionDescription(transaction: CreditTransactionRow): string {
  if (transaction.source === "free_trial") {
    return "Free trial credits"
  }
  if (transaction.source === "credit_pack") {
    return "Credit pack purchase"
  }
  if (transaction.source === "subscription_renewal") {
    return "Subscription renewal"
  }
  if (transaction.source === "video_job" || transaction.source === "video_generation") {
    return transaction.video_job_id ? `Video generation ${transaction.video_job_id.slice(0, 8)}` : "Video generation"
  }
  if (transaction.source === "video_job_failed" || transaction.source === "render_failure") {
    return transaction.video_job_id ? `Refund for ${transaction.video_job_id.slice(0, 8)}` : "Render refund"
  }
  return transaction.source?.replaceAll("_", " ") || "Credit transaction"
}

function AuthRequired() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <CreditCard className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Sign in to manage billing</CardTitle>
          <CardDescription className="mb-6">
            Billing, credits, and Stripe customer records are tied to your account.
          </CardDescription>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function BillingUnavailable() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <CreditCard className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">Billing unavailable</CardTitle>
          <CardDescription>
            The billing tables or environment variables are not available in this deployment.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
