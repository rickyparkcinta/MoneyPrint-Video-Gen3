export type PlanId = "free" | "starter" | "pro" | "agency";

export type BillingPlan = {
  id: PlanId;
  name: string;
  monthlyCredits: number;
  priceUsd: number;
  stripeEnvKey?: string;
  stripeLookupKey?: string;
  description: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    monthlyCredits: 5,
    priceUsd: 0,
    description: "Try the workflow with a small launch balance."
  },
  {
    id: "starter",
    name: "Starter",
    monthlyCredits: 50,
    priceUsd: 19,
    stripeEnvKey: "STRIPE_STARTER_PRICE_ID",
    stripeLookupKey: "moneyprint_starter_monthly",
    description: "For solo creators producing regular shorts."
  },
  {
    id: "pro",
    name: "Pro",
    monthlyCredits: 180,
    priceUsd: 49,
    stripeEnvKey: "STRIPE_PRO_PRICE_ID",
    stripeLookupKey: "moneyprint_pro_monthly",
    description: "For weekly content pipelines and client work."
  },
  {
    id: "agency",
    name: "Agency",
    monthlyCredits: 700,
    priceUsd: 149,
    stripeEnvKey: "STRIPE_AGENCY_PRICE_ID",
    stripeLookupKey: "moneyprint_agency_monthly",
    description: "For higher-volume short-video operations."
  }
];

export const CREDIT_PACK = {
  id: "credit_pack_25",
  name: "25 credit pack",
  credits: 25,
  stripeEnvKey: "STRIPE_CREDIT_PACK_PRICE_ID",
  stripeLookupKey: "moneyprint_credit_pack_25"
} as const;

export function getPlanById(planId: string): BillingPlan | undefined {
  return BILLING_PLANS.find((plan) => plan.id === planId);
}

export function calculateCreditCost(durationSeconds: number, variants = 1): number {
  const durationCost = durationSeconds <= 30 ? 1 : durationSeconds <= 60 ? 2 : 3;
  return durationCost * Math.max(1, variants);
}
