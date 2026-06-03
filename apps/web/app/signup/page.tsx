import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <section className="page">
      <h1 className="page-title">Sign up</h1>
      <p className="lede">Create a Supabase-authenticated account and receive the free trial credit grant.</p>
      <AuthForm mode="signup" />
      <div className="actions">
        <Link className="button" href="/login">
          I already have an account
        </Link>
      </div>
    </section>
  );
}
