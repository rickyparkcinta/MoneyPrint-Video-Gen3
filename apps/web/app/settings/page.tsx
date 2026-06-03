import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const { user } = await getAuthenticatedUser();

  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="lede">Profile and product defaults for the MVP account.</p>
      </div>
      <div className="panel panel-pad grid" style={{ maxWidth: 620 }}>
        <div className="field">
          <label>Email</label>
          <input readOnly value={user?.email || "Sign in required"} />
        </div>
        <div className="field">
          <label>Default format</label>
          <input readOnly value="English, 9:16, one variant" />
        </div>
        <Link className="button" href="/billing">
          Billing
        </Link>
      </div>
    </section>
  );
}
