# MoneyPrint Video Gen

MoneyPrint Video Gen is a commercial AI short-video generation SaaS built around the vendored [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) engine.

The SaaS stack is intentionally split:

- Vercel runs the Next.js frontend, lightweight API routes, Stripe webhooks, and the QStash-to-Cloud-Run dispatcher.
- Supabase owns auth, Postgres job/credit state, RLS, and private MVP storage.
- Stripe owns paid checkout, subscription status, invoices, and customer billing.
- QStash retries the dispatch trigger.
- Google Cloud Run Jobs run the heavy MoneyPrinterTurbo render container.

Local build is intentionally skipped for this bootstrap per the workspace instruction.

## Repo Layout

```text
apps/web              Next.js app for Vercel
packages/shared       Shared pricing, status, and validation types
services/worker       Cloud Run Job wrapper and vendored MoneyPrinterTurbo engine
supabase/migrations   Database, RLS, storage, and RPC setup
infra                 Deployment notes and starter manifests
docs                  Architecture, deployment, billing, worker, and legal notes
```

## First MVP Goal

A signed-in user buys credits with Stripe, creates one 9:16 video job, QStash dispatches the Cloud Run Job, the worker generates and uploads a video, and Supabase marks the job completed.

## License Notice

The vendored MoneyPrinterTurbo project is MIT licensed. Its license notice is preserved in `LICENSE`, `services/worker/moneyprinter/LICENSE`, and `THIRD_PARTY_LICENSES.md`.

Bundled/default music from upstream has been removed from `services/worker/moneyprinter/resource/songs` for commercial launch safety. Add only properly licensed tracks.
