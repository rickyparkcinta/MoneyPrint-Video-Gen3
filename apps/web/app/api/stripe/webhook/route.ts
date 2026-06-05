import { getPlanById } from "@moneyprint/shared";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function recordStripeEvent(event: Stripe.Event) {
  const { error } = await getSupabaseAdmin().from("stripe_events").insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>
  });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  throw new Error(error.message);
}

async function grantCredits(userId: string, amount: number, source: string, eventId: string) {
  if (!amount || amount <= 0) {
    return;
  }

  await getSupabaseAdmin().rpc("grant_user_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
    p_stripe_event_id: eventId
  });
}

async function processReferralPayment(userId: string, basisCredits: number, source: string, eventId: string) {
  if (!basisCredits || basisCredits <= 0) {
    return;
  }

  await getSupabaseAdmin().rpc("process_referral_payment", {
    p_payer_user_id: userId,
    p_basis_credits: basisCredits,
    p_source: source,
    p_stripe_event_id: eventId
  });
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  const planId = subscription.metadata.plan_id;
  if (!userId || !planId) {
    return;
  }

  // In newer Stripe API versions current_period_* live on each subscription
  // item rather than the subscription. Read from either location.
  const subWithPeriods = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const firstItem = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const periodStart = subWithPeriods.current_period_start ?? firstItem?.current_period_start ?? null;
  const periodEnd = subWithPeriods.current_period_end ?? firstItem?.current_period_end ?? null;

  await getSupabaseAdmin().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      plan_id: planId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    },
    { onConflict: "stripe_subscription_id" }
  );
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const subscription = invoiceWithSubscription.subscription;
  if (!subscription) {
    return null;
  }
  return typeof subscription === "string" ? subscription : subscription.id;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  const isNew = await recordStripeEvent(event);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (session.mode === "payment" && userId) {
        const creditAmount = Number(session.metadata?.credit_amount || 0);
        await grantCredits(userId, creditAmount, "credit_pack", event.id);
        await processReferralPayment(userId, creditAmount, "credit_pack", event.id);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (!subscriptionId) {
        break;
      }

      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      await upsertSubscription(subscription);
      const userId = subscription.metadata.user_id;
      const plan = getPlanById(subscription.metadata.plan_id);
      if (userId && plan) {
        await grantCredits(userId, plan.monthlyCredits, "subscription_renewal", event.id);
        await processReferralPayment(userId, plan.monthlyCredits, "subscription_renewal", event.id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await upsertSubscription(subscription);
      }
      break;
    }

    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
