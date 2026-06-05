import { BILLING_PLANS, CREDIT_PACK, getPlanById } from "@moneyprint/shared";
import { getStripe } from "@/lib/stripe/client";

type StripeCheckoutPrice = {
  priceId: string;
  mode: "subscription" | "payment";
  credits: number;
};

export async function getStripePriceForPlan(planId: string): Promise<StripeCheckoutPrice | null> {
  if (planId === CREDIT_PACK.id) {
    const priceId = process.env[CREDIT_PACK.stripeEnvKey];
    return getConfiguredOrLookupPrice({
      priceId,
      lookupKey: CREDIT_PACK.stripeLookupKey,
      mode: "payment",
      credits: CREDIT_PACK.credits
    });
  }

  const plan = getPlanById(planId);
  if (!plan || !plan.stripeEnvKey) {
    return null;
  }

  const priceId = process.env[plan.stripeEnvKey];
  return getConfiguredOrLookupPrice({
    priceId,
    lookupKey: plan.stripeLookupKey,
    mode: "subscription",
    credits: plan.monthlyCredits
  });
}

async function getConfiguredOrLookupPrice(input: {
  priceId?: string;
  lookupKey?: string;
  mode: "subscription" | "payment";
  credits: number;
}): Promise<StripeCheckoutPrice | null> {
  if (input.priceId) {
    return { priceId: input.priceId, mode: input.mode, credits: input.credits };
  }

  if (!input.lookupKey) {
    return null;
  }

  const prices = await getStripe().prices.list({
    active: true,
    limit: 1,
    lookup_keys: [input.lookupKey]
  });
  const price = prices.data[0];
  if (!price) {
    return null;
  }

  const isSubscriptionPrice = Boolean(price.recurring);
  if ((input.mode === "subscription") !== isSubscriptionPrice) {
    return null;
  }

  return { priceId: price.id, mode: input.mode, credits: input.credits };
}

export function visiblePaidPlans() {
  return BILLING_PLANS.filter((plan) => plan.id !== "free");
}
