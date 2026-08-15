import { auth, currentUser } from '@clerk/nextjs/server'
import { hasActiveAccess, refreshBilling } from '@/lib/billing'
import { QUOTA_IP_BURST_LIMIT, SUBSCRIBER_MONTHLY_LIMIT } from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import {
  applyGuestUsageToUser,
  freeQuota,
  getGuestId,
  guestQuota,
} from '@/lib/guest'
import { consumeBurst, getSubscriberUsage } from '@/lib/redis'
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
      monthlyUsed: 0,
      monthlyLimit: SUBSCRIBER_MONTHLY_LIMIT,
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
  const lifetimeUsed = await applyGuestUsageToUser(
    convex,
    profile?.lifetimeSearchCount ?? 0,
    subscribed,
  )
  const monthlyUsed = subscribed ? await getSubscriberUsage(userId) : 0
  const quota = subscribed
    ? {
        remaining: Math.max(0, SUBSCRIBER_MONTHLY_LIMIT - monthlyUsed),
        paywalled: false,
        lifetimeUsed,
      }
    : await freeQuota(await getGuestId(), ip, lifetimeUsed)

  return Response.json({
    signedIn: true,
    subscribed,
    lifetimeUsed: quota.lifetimeUsed,
    monthlyUsed,
    monthlyLimit: SUBSCRIBER_MONTHLY_LIMIT,
    remaining: quota.remaining,
    paywalled: quota.paywalled,
    interval: profile?.subscriptionInterval ?? null,
  })
}
