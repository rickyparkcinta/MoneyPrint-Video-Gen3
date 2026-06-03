import type { Metadata } from "next"
import Link from "next/link"
import { Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"
import { mockPlans } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your video creation needs",
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="mr-1 size-3" />
          Simple Pricing
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Choose Your Plan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free, upgrade when you need more. All plans include our core AI video generation features.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-4">
        {mockPlans.map((plan) => {
          const isEnterprise = plan.id === "enterprise"
          const isFree = plan.id === "free"

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-lg",
                plan.popular && "border-primary shadow-lg shadow-primary/10 lg:scale-105"
              )}
            >
              {plan.popular && (
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
                  {isEnterprise ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">Custom</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {isFree ? "$0" : formatCurrency(plan.price)}
                      </span>
                      {!isFree && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                  )}
                  {!isEnterprise && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.credits} videos per month
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href={isEnterprise ? "/contact" : "/signup"}>
                    {isEnterprise ? "Contact Sales" : "Get Started"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Credit pack section */}
      <div className="mx-auto mt-16 max-w-2xl">
        <Separator className="mb-16" />

        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 p-6">
              <h3 className="text-xl font-semibold">Need More Credits?</h3>
              <p className="mt-2 text-muted-foreground">
                Top up your account with a one-time credit pack. Perfect for when you need extra videos without changing your plan.
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-muted-foreground">for 10 credits</span>
              </div>
            </div>
            <div className="flex items-center justify-center bg-muted/50 p-6 sm:px-10">
              <Button size="lg" asChild>
                <Link href="/billing">Buy Credits</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ link */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          Have questions?{" "}
          <Link href="/#faq" className="text-primary hover:underline">
            Check our FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
