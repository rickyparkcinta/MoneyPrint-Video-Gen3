"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: mode === "signup"
      }
    });

    setLoading(false);
    setMessage(error ? error.message : "Check your email for the magic link.");
  }

  return (
    <form className="panel panel-pad form" onSubmit={submit} style={{ maxWidth: 560 }}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          placeholder="you@example.com"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <button className="button primary" disabled={loading} type="submit">
        <Mail size={16} />
        {loading ? "Sending..." : mode === "signup" ? "Create account" : "Send magic link"}
      </button>
    </form>
  );
}
