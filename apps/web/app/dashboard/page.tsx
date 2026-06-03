import { Film, Wallet, Workflow } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Dashboard</h1>
        <p className="lede">Sign in to see credits, jobs, and generated videos.</p>
        <Link className="button primary" href="/login">
          Login
        </Link>
      </section>
    );
  }

  const admin = getSupabaseAdmin();
  const [{ data: balance }, { data: jobs }] = await Promise.all([
    admin.from("credit_balances").select("balance").eq("user_id", user.id).single(),
    admin
      .from("video_jobs")
      .select("id,topic,status,credit_cost,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const completed = jobs?.filter((job) => job.status === "completed").length || 0;
  const active = jobs?.filter((job) => !["completed", "failed", "cancelled", "expired"].includes(job.status)).length || 0;

  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="lede">Credits, render status, and recent MoneyPrinterTurbo jobs.</p>
      </div>

      <div className="grid three">
        <div className="stat">
          <Wallet size={22} />
          <strong>{balance?.balance ?? 0}</strong>
          <span className="muted">Available credits</span>
        </div>
        <div className="stat">
          <Workflow size={22} />
          <strong>{active}</strong>
          <span className="muted">Active jobs</span>
        </div>
        <div className="stat">
          <Film size={22} />
          <strong>{completed}</strong>
          <span className="muted">Recent completions</span>
        </div>
      </div>

      <div className="actions">
        <Link className="button primary" href="/create">
          Create video
        </Link>
        <Link className="button" href="/pricing">
          Buy credits
        </Link>
      </div>

      <div className="panel panel-pad">
        <h2>Recent jobs</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(jobs || []).map((job) => (
              <tr key={job.id}>
                <td>
                  <Link href={`/videos/${job.id}`}>{job.topic}</Link>
                </td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>{job.credit_cost}</td>
                <td>{new Date(job.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
