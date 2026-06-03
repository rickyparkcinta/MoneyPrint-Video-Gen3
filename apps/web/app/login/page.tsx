import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <section className="page">
      <h1 className="page-title">Login</h1>
      <p className="lede">
        Use Supabase magic-link auth. API routes read the resulting cookies before creating jobs, checkout sessions, or
        billing portal sessions.
      </p>
      <AuthForm mode="login" />
      <div className="actions">
        <Link className="button" href="/dashboard">
          Back to dashboard
        </Link>
        <Link className="button" href="/signup">
          Create account
        </Link>
      </div>
    </section>
  );
}
