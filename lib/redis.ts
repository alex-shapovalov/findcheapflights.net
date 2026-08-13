import { Redis } from '@upstash/redis'
import {
  FREE_SEARCH_LIMIT,
  GUEST_IP_DAILY_LIMIT,
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

function utcDay() {
  return new Date().toISOString().slice(0, 10)
}

function dailyKey(clerkId: string) {
  return `fcf:search:day:${clerkId}:${utcDay()}`
}

export async function consumeSubscriberSearch(clerkId: string) {
  const client = getRedis()
  const key = dailyKey(clerkId)
  const used = await client.incr(key)
  if (used === 1) {
    await client.expire(key, 60 * 60 * 36)
  }
  if (used > SUBSCRIBER_DAILY_LIMIT) {
    await client.decr(key)
    return {
      allowed: false,
      used: SUBSCRIBER_DAILY_LIMIT,
      remaining: 0,
    }
  }
  return {
    allowed: true,
    used,
    remaining: Math.max(0, SUBSCRIBER_DAILY_LIMIT - used),
  }
}

export async function refundSubscriberSearch(clerkId: string) {
  await getRedis().decr(dailyKey(clerkId))
}

export async function getSubscriberUsage(clerkId: string) {
  const used = await getRedis().get<number>(dailyKey(clerkId))
  return typeof used === 'number' ? used : 0
}

function guestKey(guestId: string) {
  return `fcf:guest:${guestId}`
}

function guestIpKey(ip: string) {
  return `fcf:guestip:${ip}:${utcDay()}`
}

export async function getGuestUsage(guestId: string) {
  const used = await getRedis().get<number>(guestKey(guestId))
  return typeof used === 'number' ? used : 0
}

export async function getGuestIpUsage(ip: string) {
  const used = await getRedis().get<number>(guestIpKey(ip))
  return typeof used === 'number' ? used : 0
}

export async function consumeGuestHunt(guestId: string, ip: string) {
  const client = getRedis()
  const idKey = guestKey(guestId)
  const used = await client.incr(idKey)
  if (used === 1) {
    await client.expire(idKey, 60 * 60 * 24 * 90)
  }
  if (used > FREE_SEARCH_LIMIT) {
    await client.decr(idKey)
    return { allowed: false }
  }

  const ipKey = guestIpKey(ip)
  const ipUsed = await client.incr(ipKey)
  if (ipUsed === 1) {
    await client.expire(ipKey, 60 * 60 * 36)
  }
  if (ipUsed > GUEST_IP_DAILY_LIMIT) {
    await client.decr(ipKey)
    await client.decr(idKey)
    return { allowed: false }
  }

  return { allowed: true }
}

export async function refundGuestHunt(guestId: string, ip: string) {
  const client = getRedis()
  await Promise.all([
    client.decr(guestKey(guestId)),
    client.decr(guestIpKey(ip)),
  ])
}
