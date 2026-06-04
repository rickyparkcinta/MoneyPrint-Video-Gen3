# Worker

The Render web service runs:

```text
uvicorn worker.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

Endpoints:

- `GET /healthz`
- `POST /qstash/render`

Required env:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
WORKER_ID=render-worker-001
WORKER_SHARED_SECRET=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
OPENAI_API_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
MONEYPRINT_VIDEO_SOURCE=pexels
```

The worker:

1. Accepts QStash requests quickly and returns `202`.
2. Polls Supabase for queued or stale jobs on startup and on an interval.
3. Claims a job through `claim_video_job`.
4. Maps `video_jobs.input` to `MoneyPrinterTurbo` `VideoParams`.
5. Runs `app.services.task.start` in the worker process.
6. Uploads final artifacts to Supabase Storage at `videos/{user_id}/{job_id}/...`.
7. Calls `complete_video_job_with_artifacts` or `fail_video_job`.

Rendering never runs in Vercel Functions, Supabase Edge Functions, or the QStash publish path. Default upstream music has been removed. Add only licensed tracks.

For very large videos, add resumable or S3-compatible upload support before relying on standard Supabase Storage upload.
