# QStash

QStash publishes to:

```text
POST https://your-vercel-domain/api/qstash/run-cloud-job
```

Payload:

```json
{
  "job_id": "uuid",
  "user_id": "uuid",
  "attempt": 1
}
```

The route must verify `Upstash-Signature` with the raw request body and canonical URL before dispatching Cloud Run.

QStash retries only the dispatch step. Rendering is owned by the Cloud Run Job execution and protected by the Supabase job lock.
