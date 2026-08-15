import { cookies } from 'next/headers'
import { api } from '@/convex/_generated/api'
import { FREE_IP_DAILY_LIMIT, FREE_SEARCH_LIMIT } from './constants'
import type { getAuthedConvex } from './convex-server'
import { getFreeIpUsage, getGuestUsage } from './redis'

export async function getGuestId() {
  const store = await cookies()
  const existing = store.get('fcf_guest')?.value
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing
  const id = crypto.randomUUID()
  store.set('fcf_guest', id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 90,
    path: '/',
  })
  return id
}

export async function freeQuota(guestId: string, ip: string, lifetimeUsed = 0) {
  const used = Math.max(lifetimeUsed, await getGuestUsage(guestId))
  const paywalled =
    used >= FREE_SEARCH_LIMIT ||
    (await getFreeIpUsage(ip)) >= FREE_IP_DAILY_LIMIT
  return {
    lifetimeUsed: used,
    remaining: paywalled ? 0 : Math.max(0, FREE_SEARCH_LIMIT - used),
    paywalled,
  }
}

export async function guestQuota(guestId: string, ip: string) {
  return freeQuota(guestId, ip)
}

export async function applyGuestUsageToUser(
  convex: Awaited<ReturnType<typeof getAuthedConvex>>,
  lifetimeUsed: number,
  subscribed: boolean,
) {
  const guestId = await getGuestId()
  const guestUsed = await getGuestUsage(guestId)
  const used = Math.max(lifetimeUsed, guestUsed)
  if (subscribed) return used
  if (lifetimeUsed >= FREE_SEARCH_LIMIT) return used
  if (guestUsed < FREE_SEARCH_LIMIT) return used
  try {
    await convex.mutation(api.users.consumeFreeSearch, {})
    return Math.max(lifetimeUsed + 1, guestUsed)
  } catch {
    return Math.max(used, FREE_SEARCH_LIMIT)
  }
}
