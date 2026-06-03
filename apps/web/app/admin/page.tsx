import { StatusBadge } from "@/components/StatusBadge";
import { AdminJobActions } from "@/components/AdminJobActions";
import { AdminCreditGrant } from "@/components/AdminCreditGrant";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { user } = await getAuthenticatedUser();
  const admin = getSupabaseAdmin();

  const { data: profile } = user
    ? await admin.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (!user || profile?.role !== "admin") {
    return (
      <section className="page">
        <h1 className="page-title">Admin</h1>
        <p className="lede">Admin access is restricted to profiles with role `admin`.</p>
      </section>
    );
  }

  const [{ data: jobs }, { data: users }] = await Promise.all([
    admin.from("video_jobs").select("id,topic,status,user_id,created_at,error_message").order("created_at", { ascending: false }).limit(50),
    admin.from("profiles").select("id,email,role,created_at").order("created_at", { ascending: false }).limit(50)
  ]);

  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Admin</h1>
        <p className="lede">Jobs, users, failed renders, credits, and worker health.</p>
      </div>

      <div className="grid two">
        <div className="panel panel-pad">
          <h2>Recent jobs</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Status</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(jobs || []).map((job) => (
                <tr key={job.id}>
                  <td>{job.topic}</td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>{job.error_message || ""}</td>
                  <td>
                    <AdminJobActions jobId={job.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid">
          <AdminCreditGrant />
          <div className="panel panel-pad">
            <h2>Users</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {(users || []).map((profileRow) => (
                  <tr key={profileRow.id}>
                    <td>{profileRow.email}</td>
                    <td>{profileRow.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
