import { cookies } from 'next/headers'
import { api } from '@/convex/_generated/api'
import { FREE_IP_DAILY_LIMIT, FREE_SEARCH_LIMIT } from './constants'
import type { getAuthedConvex } from './convex-server'
import { getFreeIpUsage, getGuestUsage } from './redis'

const GUEST_COOKIE = 'fcf_guest'
const GUEST_MAX_AGE = 60 * 60 * 24 * 90
const GUEST_ID = /^[0-9a-f-]{36}$/i

export async function getGuestId() {
  const store = await cookies()
  const existing = store.get(GUEST_COOKIE)?.value
  if (existing && GUEST_ID.test(existing)) return existing
  const id = crypto.randomUUID()
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: GUEST_MAX_AGE,
    path: '/',
  })
  return id
}

export async function guestQuota(guestId: string, ip: string) {
  const used = await getGuestUsage(guestId)
  const ipUsed = await getFreeIpUsage(ip)
  const paywalled = used >= FREE_SEARCH_LIMIT || ipUsed >= FREE_IP_DAILY_LIMIT
  return {
    lifetimeUsed: used,
    remaining: paywalled ? 0 : Math.max(0, FREE_SEARCH_LIMIT - used),
    paywalled,
  }
}

export async function applyGuestUsageToUser(
  convex: Awaited<ReturnType<typeof getAuthedConvex>>,
  lifetimeUsed: number,
  subscribed: boolean,
) {
  if (subscribed || lifetimeUsed >= FREE_SEARCH_LIMIT) return lifetimeUsed
  const guestId = await getGuestId()
  const used = await getGuestUsage(guestId)
  if (used < FREE_SEARCH_LIMIT) return lifetimeUsed
  try {
    await convex.mutation(api.users.consumeFreeSearch, {})
    return lifetimeUsed + 1
  } catch {
    return Math.max(lifetimeUsed, FREE_SEARCH_LIMIT)
  }
}
