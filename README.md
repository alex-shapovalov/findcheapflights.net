# Find Cheap Flights

AI fare hunter: nearby airports + a continent, or a locked destination with flexible origins. Round trip or one way, optional price bounds.

- 1 free search
- Pro: $11.99/month or $199.99/year, 25 searches/day

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Fill Clerk, Convex, OpenRouter, Upstash, and a [restricted Stripe key](https://docs.stripe.com/keys/restricted-api-keys.md) (Checkout, Customers, Subscriptions, Billing Portal).

In Convex, set `CLERK_JWT_ISSUER_DOMAIN` (Clerk Frontend API URL, e.g. `https://your-app.clerk.accounts.dev`) and `STRIPE_WEBHOOK_SECRET` to the same values as `.env.local`. Create a Clerk JWT template named `convex`.

In Stripe, create one Product with two Prices ($11.99/month and $199.99/year). Put those Price IDs in `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`. Enable the Customer Portal. Webhook: `/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.*`.

```bash
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev
pnpm exec convex env set STRIPE_WEBHOOK_SECRET whsec_...
pnpm dev
```

`pnpm dev` runs Next, Convex, and `stripe listen` together. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli.md) and run `stripe login` once. Copy the printed `whsec_...` into `.env.local` and Convex env.

Long hunts can exceed Vercel Hobby’s 60s cap.
