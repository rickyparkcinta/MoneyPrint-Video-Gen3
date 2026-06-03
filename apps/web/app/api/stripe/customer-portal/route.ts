import { NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer exists yet." }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl()}/billing`
  });

  return NextResponse.json({ url: session.url });
}
