import Stripe from 'stripe'
import { SUBSCRIPTION_STATUSES, type SubscriptionStatus } from '@/convex/guards'

let stripeClient: Stripe | null = null

const KNOWN_STATUSES = new Set<string>(SUBSCRIPTION_STATUSES)

export function normalizeSubscriptionStatus(
  status: string | undefined,
): SubscriptionStatus {
  if (status && KNOWN_STATUSES.has(status)) {
    return status as SubscriptionStatus
  }
  return 'none'
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe error: Stripe secret key is not configured 210')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

export function isActiveSubscriptionStatus(status: string | undefined) {
  return status === 'active' || status === 'trialing'
}

export function priceIdForInterval(interval: 'month' | 'year') {
  const id =
    interval === 'year'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY
  if (!id) {
    throw new Error(
      interval === 'year'
        ? 'Stripe error: Stripe price yearly is not configured 211'
        : 'Stripe error: Stripe price monthly is not configured 212',
    )
  }
  return id
}

export type SubscriptionInterval = 'day' | 'week' | 'month' | 'year'

export function intervalOf(
  subscription: Stripe.Subscription,
): SubscriptionInterval | undefined {
  const interval = subscription.items.data[0]?.price.recurring?.interval
  if (
    interval === 'day' ||
    interval === 'week' ||
    interval === 'month' ||
    interval === 'year'
  ) {
    return interval as SubscriptionInterval
  }
}

export function periodEndMs(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined
  if (typeof item?.current_period_end === 'number') {
    return item.current_period_end * 1000
  }
  const fallback = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end
  return typeof fallback === 'number' ? fallback * 1000 : undefined
}

export function billingFromSubscription(subscription: Stripe.Subscription) {
  return {
    stripeCustomerId: String(subscription.customer),
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: normalizeSubscriptionStatus(subscription.status),
    subscriptionInterval: intervalOf(subscription),
    currentPeriodEnd: periodEndMs(subscription),
  }
}

export async function latestSubscription(customerId: string) {
  const list = await getStripe().subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
  })
  return (
    list.data.find(item => isActiveSubscriptionStatus(item.status)) ??
    list.data.sort((a, b) => b.created - a.created)[0]
  )
}
