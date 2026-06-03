# Worker

The Cloud Run Job executes:

```text
python /app/worker.py
```

Required env:

```env
VIDEO_JOB_ID=
VIDEO_JOB_USER_ID=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
WORKER_ID=cloud-run-worker-001
OPENAI_API_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=
MONEYPRINT_VIDEO_SOURCE=pexels
```

The worker:

1. Writes `moneyprinter/config.toml` from environment variables.
2. Claims the job through `claim_video_job`.
3. Maps the SaaS job row to `MoneyPrinterTurbo` `VideoParams`.
4. Runs `app.services.task.start`.
5. Uploads final artifacts to private Supabase Storage.
6. Calls `complete_video_job` or `fail_video_job_and_refund`.

Default upstream music has been removed. Add only licensed tracks.
