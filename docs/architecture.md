# Architecture

```text
User
  -> Vercel Next.js app
  -> Vercel API creates Supabase job and deducts credits
  -> QStash triggers /api/qstash/run-cloud-job
  -> Vercel dispatches Google Cloud Run Job
  -> Cloud Run Job runs services/worker/worker.py
  -> MoneyPrinterTurbo renders the video
  -> Worker uploads output to private Supabase Storage
  -> Worker marks Supabase job completed
```

## Boundaries

- Vercel is the control plane only: auth UI, job creation, Stripe webhooks, and Cloud Run dispatch.
- Supabase is the source of truth for auth, credits, job state, and private MVP storage.
- Stripe is the only money system.
- QStash retries dispatch, not rendering.
- Cloud Run Jobs own long-running video rendering.

## Job Idempotency

- `create_video_job_with_credit` deducts credits and inserts the job in one transaction.
- `claim_video_job` locks a job before rendering.
- `complete_video_job` clears the lock and stores artifact paths.
- `fail_video_job_and_refund` marks failed jobs and refunds credits once.
