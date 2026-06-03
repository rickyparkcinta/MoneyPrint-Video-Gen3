"use client";

import { Gift } from "lucide-react";
import { useState } from "react";

export function AdminCreditGrant() {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/credits/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    setMessage(response.ok ? "Credits granted." : payload.error || "Credit grant failed.");
  }

  return (
    <form className="panel panel-pad form" onSubmit={submit}>
      <h2>Grant credits</h2>
      <div className="field">
        <label htmlFor="admin-user-id">User ID</label>
        <input id="admin-user-id" required value={userId} onChange={(event) => setUserId(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="admin-credit-amount">Amount</label>
        <input
          id="admin-credit-amount"
          min={1}
          required
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
        />
      </div>
      {message ? <p className="notice">{message}</p> : null}
      <button className="button primary" disabled={loading} type="submit">
        <Gift size={16} />
        {loading ? "Granting..." : "Grant credits"}
      </button>
    </form>
  );
}
