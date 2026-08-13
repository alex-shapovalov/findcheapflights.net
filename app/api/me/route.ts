import { auth, currentUser } from '@clerk/nextjs/server'
import { hasActiveAccess, refreshBilling } from '@/lib/billing'
import { FREE_SEARCH_LIMIT, SUBSCRIBER_DAILY_LIMIT } from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import {
  applyGuestUsageToUser,
  clientIp,
  getGuestId,
  guestQuota,
} from '@/lib/guest'
import { getSubscriberUsage } from '@/lib/redis'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    const quota = await guestQuota(await getGuestId(), clientIp(request))
    return Response.json({
      signedIn: false,
      subscribed: false,
      lifetimeUsed: quota.lifetimeUsed,
      dailyUsed: 0,
      dailyLimit: SUBSCRIBER_DAILY_LIMIT,
      remaining: quota.remaining,
      paywalled: quota.paywalled,
    })
  }

  const convex = await getAuthedConvex()
  const user = await currentUser()
  await convex.mutation(api.users.ensure, {
    email: user?.primaryEmailAddress?.emailAddress,
  })
  const profile = await refreshBilling(
    convex,
    await convex.query(api.users.me, {}),
  )
  const subscribed = hasActiveAccess(profile)
  let lifetimeUsed = profile?.lifetimeSearchCount ?? 0
  lifetimeUsed = await applyGuestUsageToUser(convex, lifetimeUsed, subscribed)
  const dailyUsed = subscribed ? await getSubscriberUsage(userId) : 0
  const remaining = subscribed
    ? Math.max(0, SUBSCRIBER_DAILY_LIMIT - dailyUsed)
    : Math.max(0, FREE_SEARCH_LIMIT - lifetimeUsed)

  return Response.json({
    signedIn: true,
    subscribed,
    lifetimeUsed,
    dailyUsed,
    dailyLimit: SUBSCRIBER_DAILY_LIMIT,
    remaining,
    paywalled: !subscribed && lifetimeUsed >= FREE_SEARCH_LIMIT,
    interval: profile?.subscriptionInterval ?? null,
  })
}
