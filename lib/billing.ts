import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import type { getAuthedConvex } from './convex-server'
import {
  billingFromSubscription,
  isActiveSubscriptionStatus,
  latestSubscription,
} from './stripe'

export function hasActiveAccess(
  user: Pick<Doc<'users'>, 'subscriptionStatus' | 'currentPeriodEnd'> | null,
) {
  return (
    isActiveSubscriptionStatus(user?.subscriptionStatus) &&
    (user?.currentPeriodEnd == null || user.currentPeriodEnd > Date.now())
  )
}

export async function refreshBilling(
  convex: Awaited<ReturnType<typeof getAuthedConvex>>,
  user: Doc<'users'> | null,
) {
  if (!user?.stripeCustomerId) return user
  if (
    hasActiveAccess(user) &&
    user.currentPeriodEnd != null &&
    user.currentPeriodEnd > Date.now()
  ) {
    return user
  }

  const subscription = await latestSubscription(user.stripeCustomerId)
  if (!subscription) {
    await convex.mutation(api.users.saveBilling, {
      stripeCustomerId: user.stripeCustomerId,
      subscriptionStatus: 'none',
    })
    return {
      ...user,
      subscriptionStatus: 'none',
      stripeSubscriptionId: undefined,
      subscriptionInterval: undefined,
      currentPeriodEnd: undefined,
    }
  }

  const billing = billingFromSubscription(subscription)
  await convex.mutation(api.users.saveBilling, billing)
  return { ...user, ...billing }
}
