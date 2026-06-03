import { CREDIT_PACK } from "@moneyprint/shared";
import { CheckoutButton } from "@/components/CheckoutButton";
import { visiblePaidPlans } from "@/lib/stripe/prices";

export default function PricingPage() {
  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Pricing</h1>
        <p className="lede">Stripe controls money. Supabase controls credits and access.</p>
      </div>

      <div className="grid three">
        {visiblePaidPlans().map((plan) => (
          <div className="panel panel-pad grid" key={plan.id}>
            <h2>{plan.name}</h2>
            <strong style={{ fontSize: 36 }}>${plan.priceUsd}/mo</strong>
            <p className="muted">{plan.description}</p>
            <p>{plan.monthlyCredits} monthly credits</p>
            <CheckoutButton label={`Subscribe to ${plan.name}`} planId={plan.id} />
          </div>
        ))}
      </div>

      <div className="panel panel-pad grid" style={{ maxWidth: 520 }}>
        <h2>{CREDIT_PACK.name}</h2>
        <p className="muted">One-time top-up for users who need extra renders without changing plan.</p>
        <CheckoutButton label="Buy credit pack" planId={CREDIT_PACK.id} />
      </div>
    </section>
  );
}
