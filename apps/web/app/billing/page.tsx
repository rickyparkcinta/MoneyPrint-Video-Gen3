import Link from "next/link";
import { PortalButton } from "@/components/PortalButton";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function BillingPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Billing</h1>
        <p className="lede">Sign in to manage billing.</p>
        <Link className="button primary" href="/login">
          Login
        </Link>
      </section>
    );
  }

  const [{ data: balance }, { data: subscriptions }] = await Promise.all([
    getSupabaseAdmin().from("credit_balances").select("balance").eq("user_id", user.id).single(),
    getSupabaseAdmin()
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Billing</h1>
        <p className="lede">Manage Stripe subscription state and credit balance.</p>
      </div>

      <div className="grid two">
        <div className="stat">
          <strong>{balance?.balance ?? 0}</strong>
          <span className="muted">Current credits</span>
        </div>
        <div className="stat">
          <strong>{subscriptions?.[0]?.status || "No subscription"}</strong>
          <span className="muted">Subscription status</span>
        </div>
      </div>

      <div className="actions">
        <PortalButton />
        <Link className="button primary" href="/pricing">
          Change plan
        </Link>
      </div>
    </section>
  );
}
