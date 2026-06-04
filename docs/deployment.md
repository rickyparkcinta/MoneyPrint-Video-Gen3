# Deployment

Local build is intentionally skipped for this workspace.

## Order

1. Create Supabase project and run `supabase/migrations/0001_core_saas_schema.sql`.
2. Create Stripe products/prices and set Vercel env vars.
3. Deploy `apps/web` to Vercel.
4. Deploy the Docker worker to Render using `render.yaml`.
5. Set `RENDER_WORKER_URL` on Vercel to the Render service URL.
6. Set `UPSTASH_QSTASH_TOKEN` on Vercel and either QStash signing keys or `WORKER_SHARED_SECRET` on the worker.
7. Create one test user, grant/buy credits, and run a real render job.

## Required Hosted Checks

- Supabase RLS blocks cross-user `video_jobs` reads.
- Stripe webhook rejects invalid signatures and ignores duplicate events.
- Render `/qstash/render` rejects unsigned requests when signing keys are configured.
- Render `/qstash/render` returns `202` quickly and updates Supabase asynchronously.
