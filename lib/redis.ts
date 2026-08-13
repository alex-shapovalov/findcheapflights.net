import { Redis } from '@upstash/redis'
import {
  BURST_WINDOW_SECONDS,
  FREE_IP_DAILY_LIMIT,
  FREE_SEARCH_LIMIT,
  SUBSCRIBER_DAILY_LIMIT,
} from './constants'

let redis: Redis | null = null

export function getRedis() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error('Upstash Redis is not configured')
  }
  if (!redis) {
    redis = Redis.fromEnv()
  }
  return redis
}

const DAY_SECONDS = 60 * 60 * 24
const GUEST_TTL_SECONDS = DAY_SECONDS * 90
const DAILY_TTL_SECONDS = 60 * 60 * 36

type Budget = {
  key: string
  limit: number
  ttlSeconds: number
}

const CONSUME_SCRIPT = `
for i = 1, #KEYS do
  local limit = tonumber(ARGV[(i - 1) * 2 + 1])
  local ttl = tonumber(ARGV[(i - 1) * 2 + 2])
  local used = redis.call('INCR', KEYS[i])
  if used == 1 then
    redis.call('EXPIRE', KEYS[i], ttl)
  end
  if used > limit then
    redis.call('DECR', KEYS[i])
    for j = 1, i - 1 do
      redis.call('DECR', KEYS[j])
    end
    return i
  end
end
return 0
`

const REFUND_SCRIPT = `
for i = 1, #KEYS do
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current > 0 then
    redis.call('DECR', KEYS[i])
  end
end
return 0
`

async function consumeBudgets(budgets: Budget[]) {
  const blockedAt = await getRedis().eval<(number | string)[], number>(
    CONSUME_SCRIPT,
    budgets.map(budget => budget.key),
    budgets.flatMap(budget => [budget.limit, budget.ttlSeconds]),
  )
  return { allowed: blockedAt === 0, blockedAt }
}

async function refundBudgets(keys: string[]) {
  if (keys.length === 0) return
  await getRedis().eval<never[], number>(REFUND_SCRIPT, keys, [])
}

async function usageOf(key: string) {
  const used = await getRedis().get<number>(key)
  return typeof used === 'number' ? used : 0
}

function utcDay() {
  return new Date().toISOString().slice(0, 10)
}

function subscriberDayKey(clerkId: string) {
  return `fcf:search:day:${clerkId}:${utcDay()}`
}

function guestKey(guestId: string) {
  return `fcf:guest:${guestId}`
}

function freeIpKey(ip: string) {
  return `fcf:freeip:${ip}:${utcDay()}`
}

function burstKey(scope: string, id: string) {
  const window = Math.floor(Date.now() / 1000 / BURST_WINDOW_SECONDS)
  return `fcf:burst:${scope}:${id}:${window}`
}

export async function consumeBurst(
  entries: Array<{ scope: string; id: string; limit: number }>,
) {
  const { allowed } = await consumeBudgets(
    entries.map(entry => ({
      key: burstKey(entry.scope, entry.id),
      limit: entry.limit,
      ttlSeconds: BURST_WINDOW_SECONDS * 2,
    })),
  )
  return allowed
}

export async function consumeSubscriberSearch(clerkId: string) {
  const key = subscriberDayKey(clerkId)
  const { allowed } = await consumeBudgets([
    { key, limit: SUBSCRIBER_DAILY_LIMIT, ttlSeconds: DAILY_TTL_SECONDS },
  ])
  if (!allowed) {
    return {
      allowed: false as const,
      used: SUBSCRIBER_DAILY_LIMIT,
      remaining: 0,
    }
  }
  const used = await usageOf(key)
  return {
    allowed: true as const,
    used,
    remaining: Math.max(0, SUBSCRIBER_DAILY_LIMIT - used),
  }
}

export async function refundSubscriberSearch(clerkId: string) {
  await refundBudgets([subscriberDayKey(clerkId)])
}

export function getSubscriberUsage(clerkId: string) {
  return usageOf(subscriberDayKey(clerkId))
}

export function getGuestUsage(guestId: string) {
  return usageOf(guestKey(guestId))
}

export function getFreeIpUsage(ip: string) {
  return usageOf(freeIpKey(ip))
}

export async function consumeGuestHunt(guestId: string, ip: string) {
  const { allowed } = await consumeBudgets([
    {
      key: guestKey(guestId),
      limit: FREE_SEARCH_LIMIT,
      ttlSeconds: GUEST_TTL_SECONDS,
    },
    {
      key: freeIpKey(ip),
      limit: FREE_IP_DAILY_LIMIT,
      ttlSeconds: DAILY_TTL_SECONDS,
    },
  ])
  return { allowed }
}

export async function refundGuestHunt(guestId: string, ip: string) {
  await refundBudgets([guestKey(guestId), freeIpKey(ip)])
}

export async function consumeFreeIpHunt(ip: string) {
  const { allowed } = await consumeBudgets([
    {
      key: freeIpKey(ip),
      limit: FREE_IP_DAILY_LIMIT,
      ttlSeconds: DAILY_TTL_SECONDS,
    },
  ])
  return { allowed }
}

export async function refundFreeIpHunt(ip: string) {
  await refundBudgets([freeIpKey(ip)])
}
