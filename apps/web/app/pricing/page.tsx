import type { Metadata } from "next"
import Link from "next/link"
import { BILLING_PLANS, CREDIT_PACK } from "@moneyprint/shared"
import { Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckoutButton } from "@/components/CheckoutButton"
import { cn, formatCurrency } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your video creation needs",
}

const planFeatures: Record<string, string[]> = {
  free: ["5 launch credits", "Private Supabase video storage", "MoneyPrinterTurbo render queue"],
  starter: ["50 credits per month", "Cloud Run render dispatch", "Private video output links"],
  pro: ["180 credits per month", "Higher-volume creator workflow", "Stripe-managed subscription"],
  agency: ["700 credits per month", "Agency-volume render budget", "Stripe-managed subscription"],
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="mr-1 size-3" />
          Simple Pricing
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Choose Your Plan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free, upgrade when you need more real render credits.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-4">
        {BILLING_PLANS.map((plan) => {
          const isFree = plan.id === "free"
          const isPopular = plan.id === "pro"

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-lg",
                isPopular && "border-primary shadow-lg shadow-primary/10 lg:scale-105"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {formatCurrency(plan.priceUsd * 100)}
                    </span>
                    {!isFree && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.monthlyCredits} credits per month
                  </p>
                </div>

                <ul className="space-y-3">
                  {(planFeatures[plan.id] || []).map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {isFree ? (
                  <Button className="w-full" variant="outline" size="lg" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                ) : (
                  <CheckoutButton
                    planId={plan.id}
                    label={`Choose ${plan.name}`}
                    variant={isPopular ? "default" : "outline"}
                    className="w-full"
                  />
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mx-auto mt-16 max-w-2xl">
        <Separator className="mb-16" />

        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-6">
              <h3 className="text-xl font-semibold">Need More Credits?</h3>
              <p className="mt-2 text-muted-foreground">
                Top up your account with a one-time Stripe checkout session.
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{CREDIT_PACK.credits}</span>
                <span className="text-muted-foreground">additional credits</span>
              </div>
            </div>
            <div className="flex items-center justify-center bg-muted/50 p-6 sm:px-10">
              <CheckoutButton planId={CREDIT_PACK.id} label="Buy Credits" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Have questions?{" "}
          <Link href="/#faq" className="text-primary hover:underline">
            Check our FAQ
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
