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
import { getI18n } from "@/lib/i18n-server"
import { interpolate, type Dictionary } from "@/lib/i18n"

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
  const { locale, dict } = await getI18n()
  let credits = 0
  let subscription: SubscriptionRow | null = null
  let transactions: CreditTransactionRow[] = []

  try {
    const { user } = await getAuthenticatedUser()
    if (!user) {
      return <AuthRequired dict={dict} />
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
    return <BillingUnavailable dict={dict} />
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{dict.billing.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {dict.billing.subtitle}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {dict.create.availableCredits}
            </CardTitle>
            <Coins className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{credits}</div>
            <div className="mt-2">
              <Progress value={creditUsagePercent} className="h-1.5" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {dict.billing.accountBalance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {dict.billing.currentPlan}
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
              {formatCurrency(currentPlan.priceUsd * 100, locale)}{dict.pricing.perMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {dict.billing.nextBillingDate}
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{daysUntilRenewal ?? "-"}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {periodEnd
                ? interpolate(dict.billing.daysUntil, { date: formatDate(periodEnd, locale) })
                : dict.billing.noSubscription}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{dict.billing.subscription}</CardTitle>
          <CardDescription>{dict.billing.subscriptionDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{interpolate(dict.billing.planLabel, { plan: currentPlan.name })}</h3>
                <Badge variant={subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "success" : "secondary"}>
                  {subscriptionStatus}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {interpolate(dict.billing.planLine, {
                  credits: currentPlan.monthlyCredits,
                  price: formatCurrency(currentPlan.priceUsd * 100, locale),
                })}
              </p>
              {periodEnd && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {interpolate(subscription?.cancel_at_period_end ? dict.billing.endsOn : dict.billing.renewsOn, {
                    date: formatDate(periodEnd, locale),
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/pricing">
                  {dict.common.changePlan}
                  <ArrowUpRight className="ml-1 size-4" />
                </Link>
              </Button>
              <PortalButton label={dict.billing.portal} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{dict.billing.paymentMethod}</CardTitle>
          <CardDescription>{dict.billing.paymentDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{dict.billing.stripePortal}</p>
                <p className="text-sm text-muted-foreground">{dict.billing.stripePortalDescription}</p>
              </div>
            </div>
            <PortalButton label={dict.billing.manageStripe} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{dict.billing.moreCredits}</CardTitle>
          <CardDescription>{dict.billing.moreCreditsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{CREDIT_PACK.name}</p>
              <p className="text-sm text-muted-foreground">
                {interpolate(dict.billing.creditPackLine, { credits: CREDIT_PACK.credits })}
              </p>
            </div>
            <CheckoutButton planId={CREDIT_PACK.id} label={dict.common.buyCredits} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.billing.creditHistory}</CardTitle>
          <CardDescription>{dict.billing.creditHistoryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.billing.description}</TableHead>
                  <TableHead>{dict.billing.type}</TableHead>
                  <TableHead>{dict.common.credits}</TableHead>
                  <TableHead>{dict.billing.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transactionDescription(transaction, dict)}</TableCell>
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
                      {formatDate(transaction.created_at, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <Receipt className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{dict.billing.noTransactions}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function transactionDescription(transaction: CreditTransactionRow, dict: Dictionary): string {
  if (transaction.source === "free_trial") {
    return dict.billing.transaction.freeTrial
  }
  if (transaction.source === "credit_pack") {
    return dict.billing.transaction.creditPack
  }
  if (transaction.source === "subscription_renewal") {
    return dict.billing.transaction.renewal
  }
  if (transaction.source === "video_job" || transaction.source === "video_generation") {
    return transaction.video_job_id
      ? interpolate(dict.billing.transaction.videoWithId, { id: transaction.video_job_id.slice(0, 8) })
      : dict.billing.transaction.video
  }
  if (transaction.source === "video_job_failed" || transaction.source === "render_failure") {
    return transaction.video_job_id
      ? interpolate(dict.billing.transaction.refundWithId, { id: transaction.video_job_id.slice(0, 8) })
      : dict.billing.transaction.refund
  }
  return transaction.source?.replaceAll("_", " ") || dict.billing.transaction.generic
}

function AuthRequired({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <CreditCard className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">{dict.billing.authTitle}</CardTitle>
          <CardDescription className="mb-6">
            {dict.billing.authDescription}
          </CardDescription>
          <Button asChild>
            <Link href="/login">{dict.common.login}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function BillingUnavailable({ dict }: { dict: Dictionary }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <div className="mb-4 rounded-full bg-muted p-4">
            <CreditCard className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="mb-2">{dict.billing.unavailableTitle}</CardTitle>
          <CardDescription>
            {dict.billing.unavailableDescription}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
