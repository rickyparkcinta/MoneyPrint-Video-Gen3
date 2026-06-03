# Stripe

Use Stripe Checkout Sessions for subscriptions and one-time credit packs.

## Products

- Starter: `$19/mo`, 50 credits.
- Pro: `$49/mo`, 180 credits.
- Agency: `$149/mo`, 700 credits.
- Credit pack: one-time 25 credits.

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
