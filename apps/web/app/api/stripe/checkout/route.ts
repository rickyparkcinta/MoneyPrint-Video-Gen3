import { CREDIT_PACK } from "@moneyprint/shared";
import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getStripePriceForPlan } from "@/lib/stripe/prices";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before checkout." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { planId?: string } | null;
  const planId = body?.planId || "";
  const price = getStripePriceForPlan(planId);

  if (!price) {
    return NextResponse.json({ error: "Unknown or unconfigured Stripe price." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id,email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || profile?.email || undefined,
      metadata: { user_id: user.id }
    });
    customerId = customer.id;
    await admin.from("profiles").upsert({
      id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: price.mode,
    line_items: [{ price: price.priceId, quantity: 1 }],
    success_url: `${appUrl()}/dashboard?checkout=success`,
    cancel_url: `${appUrl()}/pricing?checkout=cancelled`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
      credit_amount: String(price.credits),
      purchase_type: planId === CREDIT_PACK.id ? "credit_pack" : "subscription"
    },
    subscription_data:
      price.mode === "subscription"
        ? {
            metadata: {
              user_id: user.id,
              plan_id: planId,
              credit_amount: String(price.credits)
            }
          }
        : undefined
  });

  return NextResponse.json({ url: session.url });
}
