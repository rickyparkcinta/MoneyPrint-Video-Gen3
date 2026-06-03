# Deployment

Local build is intentionally skipped for this workspace.

## Order

1. Create Supabase project and run `supabase/migrations/0001_core_saas_schema.sql`.
2. Create Stripe products/prices and set Vercel env vars.
3. Deploy `apps/web` to Vercel.
4. Build and deploy the worker image to Google Cloud Run Jobs.
5. Set `QSTASH_DISPATCH_URL` to the deployed Vercel route `/api/qstash/run-cloud-job`.
6. Create one test user, grant/buy credits, and run a fake then real render job.

## Required Hosted Checks

- Supabase RLS blocks cross-user `video_jobs` reads.
- Stripe webhook rejects invalid signatures and ignores duplicate events.
- QStash dispatch route rejects unsigned requests.
- Cloud Run Job receives `VIDEO_JOB_ID` and updates Supabase.
