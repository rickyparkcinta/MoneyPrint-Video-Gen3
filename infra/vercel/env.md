# Vercel Environment

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
STRIPE_CREDIT_PACK_PRICE_ID=

UPSTASH_QSTASH_TOKEN=
RENDER_WORKER_URL=
WORKER_SHARED_SECRET=
```

Vercel creates jobs, publishes QStash messages to the Render worker, and reads job status. It does not render videos.

Never expose service-role, Stripe secret, QStash, worker secret, or provider keys to the browser.
