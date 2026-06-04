# QStash

Vercel publishes directly to the Render worker:

```text
POST https://your-render-worker.onrender.com/qstash/render
```

Payload:

```json
{
  "job_id": "uuid"
}
```

Required Vercel env:

```env
UPSTASH_QSTASH_TOKEN=
RENDER_WORKER_URL=https://your-render-worker.onrender.com
WORKER_SHARED_SECRET=
```

`WORKER_SHARED_SECRET` is forwarded as an `Authorization: Bearer ...` header. When `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` are configured on the worker, the worker verifies `Upstash-Signature` and the raw body hash instead.

QStash retries only the worker wake/accept step. The Render request returns `202` quickly after the job is accepted into the worker queue; rendering continues in the worker background loop and is protected by the Supabase job lock.
