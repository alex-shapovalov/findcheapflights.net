import type { FunctionArgs } from 'convex/server'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { convexServerSecret, getConvexClient } from './convex-server'
import {
  billingFromSubscription,
  isActiveSubscriptionStatus,
  latestSubscription,
} from './stripe'

type SyncBillingArgs = FunctionArgs<typeof api.users.syncBilling>

export type BillingFields = Omit<SyncBillingArgs, 'serverSecret' | 'clerkId'>

export function hasActiveAccess(
  user: Pick<Doc<'users'>, 'subscriptionStatus' | 'currentPeriodEnd'> | null,
) {
  return (
    isActiveSubscriptionStatus(user?.subscriptionStatus) &&
    (user?.currentPeriodEnd == null || user.currentPeriodEnd > Date.now())
  )
}

export async function syncBilling(
  clerkId: string | undefined,
  billing: BillingFields,
) {
  await getConvexClient().mutation(api.users.syncBilling, {
    serverSecret: convexServerSecret(),
    clerkId,
    ...billing,
  })
}

export async function refreshBilling(user: Doc<'users'> | null) {
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
    await syncBilling(user.clerkId, {
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
  await syncBilling(user.clerkId, billing)
  return { ...user, ...billing }
}
