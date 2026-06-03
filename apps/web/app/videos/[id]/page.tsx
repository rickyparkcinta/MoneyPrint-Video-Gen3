import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { createSignedOutputUrl } from "@/lib/jobs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Video</h1>
        <p className="lede">Sign in to view this video job.</p>
        <Link className="button primary" href="/login">
          Login
        </Link>
      </section>
    );
  }

  const { data: job } = await getSupabaseAdmin()
    .from("video_jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) {
    return (
      <section className="page">
        <h1 className="page-title">Not found</h1>
        <p className="lede">This job does not exist or does not belong to you.</p>
      </section>
    );
  }

  const outputUrl = await createSignedOutputUrl(job.output_path);

  return (
    <section className="page grid two">
      <div className="grid">
        <div>
          <h1 className="page-title">{job.topic}</h1>
          <p className="lede">{job.prompt || "MoneyPrinterTurbo generation job."}</p>
        </div>
        <div className="grid two">
          <div className="stat">
            <strong style={{ fontSize: 22 }}>
              <StatusBadge status={job.status} />
            </strong>
            <span className="muted">Current status</span>
          </div>
          <div className="stat">
            <strong>{job.progress || 0}%</strong>
            <span className="muted">Progress</span>
          </div>
        </div>
        <div className="panel panel-pad">
          <h2>Job details</h2>
          <p className="muted">Credits: {job.credit_cost}</p>
          <p className="muted">Aspect: {job.aspect_ratio}</p>
          <p className="muted">Duration: {job.duration_seconds}s</p>
          {job.error_message ? <p className="notice">{job.error_message}</p> : null}
          <div className="actions">
            <Link className="button" href="/videos">
              All videos
            </Link>
            {outputUrl ? (
              <a className="button primary" href={outputUrl}>
                Download
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="video-frame">
        {outputUrl ? <video controls src={outputUrl} /> : null}
      </div>
    </section>
  );
}
