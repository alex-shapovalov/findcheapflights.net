import { auth, currentUser } from '@clerk/nextjs/server'
import { hasActiveAccess, refreshBilling } from '@/lib/billing'
import {
  FREE_IP_DAILY_LIMIT,
  FREE_SEARCH_LIMIT,
  QUOTA_IP_BURST_LIMIT,
  SUBSCRIBER_DAILY_LIMIT,
} from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { applyGuestUsageToUser, getGuestId, guestQuota } from '@/lib/guest'
import { consumeBurst, getFreeIpUsage, getSubscriberUsage } from '@/lib/redis'
import { clientIp } from '@/lib/request'

export async function GET(request: Request) {
  const ip = clientIp(request)
  const withinBurst = await consumeBurst([
    { scope: 'me:ip', id: ip, limit: QUOTA_IP_BURST_LIMIT },
  ])
  if (!withinBurst) {
    return Response.json(
      { error: 'rate_limited', message: 'Too many requests.' },
      { status: 429 },
    )
  }

  const { userId } = await auth()
  if (!userId) {
    const quota = await guestQuota(await getGuestId(), ip)
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
  const profile = await refreshBilling(await convex.query(api.users.me, {}))
  const subscribed = hasActiveAccess(profile)
  let lifetimeUsed = profile?.lifetimeSearchCount ?? 0
  lifetimeUsed = await applyGuestUsageToUser(convex, lifetimeUsed, subscribed)
  const dailyUsed = subscribed ? await getSubscriberUsage(userId) : 0
  const freeIpExhausted =
    !subscribed && (await getFreeIpUsage(ip)) >= FREE_IP_DAILY_LIMIT
  const paywalled =
    !subscribed && (lifetimeUsed >= FREE_SEARCH_LIMIT || freeIpExhausted)
  const remaining = subscribed
    ? Math.max(0, SUBSCRIBER_DAILY_LIMIT - dailyUsed)
    : Math.max(0, FREE_SEARCH_LIMIT - lifetimeUsed)

  return Response.json({
    signedIn: true,
    subscribed,
    lifetimeUsed,
    dailyUsed,
    dailyLimit: SUBSCRIBER_DAILY_LIMIT,
    remaining: paywalled ? 0 : remaining,
    paywalled,
    interval: profile?.subscriptionInterval ?? null,
  })
}
