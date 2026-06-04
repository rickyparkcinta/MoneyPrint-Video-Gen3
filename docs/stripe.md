# Stripe

Use Stripe Checkout Sessions for subscriptions and one-time credit packs.

## Safety

Never commit or paste `STRIPE_SECRET_KEY`. If a live secret key has been shared in chat, roll it in Stripe before using live mode.

## Products

- Starter: `$19/mo`, 50 credits.
- Pro: `$49/mo`, 180 credits.
- Agency: `$149/mo`, 700 credits.
- Credit pack: `$9` one-time, 25 credits.

## Create Stripe Products and Prices

After setting a rotated `STRIPE_SECRET_KEY` in `.env.local`, run:

```bash
node scripts/sync-stripe-plans.mjs --write-env=.env.local
```

The script creates or updates:

- `MoneyPrint Starter` with lookup key `moneyprint_starter_monthly`
- `MoneyPrint Pro` with lookup key `moneyprint_pro_monthly`
- `MoneyPrint Agency` with lookup key `moneyprint_agency_monthly`
- `MoneyPrint 25 Credit Pack` with lookup key `moneyprint_credit_pack_25`

For live Stripe mode, use a rotated live secret key and opt in explicitly:

```bash
node scripts/sync-stripe-plans.mjs --live --write-env=.env.local
```

Copy the printed price IDs into Vercel:

```env
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
STRIPE_CREDIT_PACK_PRICE_ID=price_...
```

## Webhooks

The webhook route verifies `stripe-signature`, records `stripe_events`, and handles:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Credit grants run through `grant_user_credits`, which is idempotent by `stripe_event_id`.
