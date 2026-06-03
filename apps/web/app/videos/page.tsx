import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function VideosPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Videos</h1>
        <p className="lede">Sign in to view your generated videos.</p>
        <Link className="button primary" href="/login">
          Login
        </Link>
      </section>
    );
  }

  const { data: jobs } = await getSupabaseAdmin()
    .from("video_jobs")
    .select("id,topic,status,credit_cost,created_at,completed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Videos</h1>
        <p className="lede">Every queued, rendering, failed, and completed job.</p>
      </div>
      <div className="panel panel-pad">
        <table className="table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Completed</th>
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
                <td>{job.completed_at ? new Date(job.completed_at).toLocaleString() : "Not yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
