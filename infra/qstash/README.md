# QStash

Set these Vercel environment variables:

```env
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
QSTASH_DISPATCH_URL=https://your-vercel-domain/api/qstash/run-cloud-job
```

`/api/videos/create` publishes the message. `/api/qstash/run-cloud-job` verifies the signature and calls Google Cloud Run Jobs.
