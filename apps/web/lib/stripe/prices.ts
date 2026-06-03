import { BILLING_PLANS, CREDIT_PACK, getPlanById } from "@moneyprint/shared";

export function getStripePriceForPlan(planId: string): { priceId: string; mode: "subscription" | "payment"; credits: number } | null {
  if (planId === CREDIT_PACK.id) {
    const priceId = process.env[CREDIT_PACK.stripeEnvKey];
    return priceId ? { priceId, mode: "payment", credits: CREDIT_PACK.credits } : null;
  }

  const plan = getPlanById(planId);
  if (!plan || !plan.stripeEnvKey) {
    return null;
  }

  const priceId = process.env[plan.stripeEnvKey];
  if (!priceId) {
    return null;
  }

  return { priceId, mode: "subscription", credits: plan.monthlyCredits };
}

export function visiblePaidPlans() {
  return BILLING_PLANS.filter((plan) => plan.id !== "free");
}
