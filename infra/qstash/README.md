# QStash

Set these Vercel environment variables:

```env
UPSTASH_QSTASH_TOKEN=
RENDER_WORKER_URL=https://your-render-worker.onrender.com
WORKER_SHARED_SECRET=
```

`/api/video-jobs` publishes `{ "job_id": "uuid" }` directly to the Render worker at `/qstash/render`. The worker returns `202` after accepting the job and performs rendering asynchronously.
