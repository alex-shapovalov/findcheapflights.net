import type Stripe from 'stripe'
import { api } from '@/convex/_generated/api'
import { getConvexClient } from '@/lib/convex-server'
import { billingFromSubscription, getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) {
    return Response.json(
      { error: 'Missing webhook signature.' },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    )
  } catch {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const convex = getConvexClient()
  const stripe = getStripe()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (
      session.mode !== 'subscription' ||
      !session.subscription ||
      !session.customer
    ) {
      return Response.json({ received: true })
    }
    const subscription = await stripe.subscriptions.retrieve(
      String(session.subscription),
    )
    await convex.mutation(api.users.applyStripeEvent, {
      webhookSecret: secret,
      clerkId:
        session.client_reference_id ??
        session.metadata?.clerkId ??
        subscription.metadata.clerkId,
      ...billingFromSubscription(subscription),
    })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    await convex.mutation(api.users.applyStripeEvent, {
      webhookSecret: secret,
      clerkId: subscription.metadata.clerkId || undefined,
      ...billingFromSubscription(subscription),
      subscriptionStatus:
        event.type === 'customer.subscription.deleted'
          ? 'canceled'
          : subscription.status,
    })
  }

  return Response.json({ received: true })
}
