import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

export const MAX_RESULT_CHARS = 60_000
export const MAX_ERROR_CHARS = 2_000
export const MAX_THEME_CHARS = 40
export const MAX_AIRPORTS = 12
export const WRITE_BUDGET = 60
export const WRITE_WINDOW_MS = 60 * 60 * 1000

export const SUBSCRIPTION_STATUSES = [
  'none',
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const subscriptionStatus = v.union(
  ...SUBSCRIPTION_STATUSES.map(status => v.literal(status)),
)

export const subscriptionInterval = v.union(
  v.literal('day'),
  v.literal('week'),
  v.literal('month'),
  v.literal('year'),
)

export async function requireClerkId(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity.subject
}

export async function requireIdentity(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity
}

function constantTimeEquals(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function requireServerSecret(provided: string) {
  const expected = process.env.CONVEX_SERVER_SECRET
  if (!expected || expected.length < 32) {
    throw new Error('CONVEX_SERVER_SECRET is not configured')
  }
  if (!constantTimeEquals(provided, expected)) {
    throw new Error('Unauthorized')
  }
}

export function boundedString(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value
}

export async function consumeWriteBudget(ctx: MutationCtx, user: Doc<'users'>) {
  const now = Date.now()
  const start = user.writeWindowStart ?? 0
  const expired = now - start >= WRITE_WINDOW_MS
  const count = expired ? 0 : (user.writeWindowCount ?? 0)

  if (count >= WRITE_BUDGET) {
    throw new Error('RATE_LIMITED')
  }

  await ctx.db.patch(user._id, {
    writeWindowStart: expired ? now : start,
    writeWindowCount: count + 1,
  })
}
