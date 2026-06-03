import Stripe from "stripe";
import { requiredEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
      typescript: true
    });
  }
  return stripeClient;
}
