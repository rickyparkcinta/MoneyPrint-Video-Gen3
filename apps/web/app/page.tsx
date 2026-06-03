import { ArrowRight, Cloud, CreditCard, Database, Film, ShieldCheck } from "lucide-react";
import Link from "next/link";

const workflowCards = [
  { title: "Vercel", text: "Frontend, APIs, webhooks, dispatch", Icon: Cloud },
  { title: "Supabase", text: "Auth, Postgres, private storage", Icon: Database },
  { title: "Stripe", text: "Checkout, subscriptions, credits", Icon: CreditCard },
  { title: "Cloud Run", text: "MoneyPrinterTurbo render jobs", Icon: Film },
  { title: "Safety", text: "RLS, signatures, job locks", Icon: ShieldCheck }
];

export default function HomePage() {
  return (
    <section className="page hero">
      <div>
        <h1>MoneyPrint Video Gen</h1>
        <p>
          A paid short-video generation SaaS that keeps web requests light, charges through Stripe, stores job truth in
          Supabase, and runs MoneyPrinterTurbo renders on Google Cloud Run Jobs.
        </p>
        <div className="actions">
          <Link className="button primary" href="/create">
            Create video <ArrowRight size={16} />
          </Link>
          <Link className="button" href="/pricing">
            View pricing
          </Link>
        </div>
      </div>

      <div className="panel panel-pad">
        <div className="grid">
          {workflowCards.map(({ title, text, Icon }) => (
            <div className="stat" key={title}>
              <Icon size={20} />
              <strong style={{ fontSize: 20 }}>{title}</strong>
              <span className="muted">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
