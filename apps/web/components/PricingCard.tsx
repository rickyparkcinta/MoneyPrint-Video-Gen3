import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import type { Plan } from "@/lib/types"

interface PricingCardProps {
  plan: Plan
  currentPlan?: boolean
  onSelect?: () => void
}

export function PricingCard({ plan, currentPlan = false, onSelect }: PricingCardProps) {
  const isEnterprise = plan.id === "enterprise"
  const isFree = plan.id === "free"

  return (
    <Card 
      className={cn(
        "relative flex flex-col transition-all duration-300",
        plan.popular && "border-primary shadow-lg shadow-primary/10",
        currentPlan && "ring-2 ring-primary"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3 py-1">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
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
              {!isFree && <span className="text-muted-foreground">/month</span>}
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
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
          size="lg"
          onClick={onSelect}
          disabled={currentPlan}
        >
          {currentPlan ? "Current Plan" : isEnterprise ? "Contact Sales" : "Get Started"}
        </Button>
      </CardFooter>
    </Card>
  )
}
