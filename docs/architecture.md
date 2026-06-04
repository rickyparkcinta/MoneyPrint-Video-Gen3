# Architecture

```text
User
  -> Vercel Next.js app
  -> Vercel API creates Supabase job and deducts credits
  -> QStash triggers Render /qstash/render
  -> Render accepts the job and returns 202
  -> Render worker processes the job in the background
  -> MoneyPrinterTurbo renders the video
  -> Worker uploads output to private Supabase Storage
  -> Worker marks Supabase job completed
```

## Boundaries

- Vercel is the control plane only: auth UI, job creation, Stripe webhooks, QStash publish, and status reads.
- Supabase is the source of truth for auth, credits, job state, and private MVP storage.
- Stripe is the only money system.
- QStash retries worker wake/accept, not rendering.
- Render owns long-running video rendering.

## Job Idempotency

- `create_video_job_with_credit` deducts credits and inserts the job in one transaction.
- `claim_video_job` locks a job before rendering.
- `complete_video_job_with_artifacts` clears the lock and stores artifact paths.
- `fail_video_job_and_refund` marks failed jobs and refunds credits once.
