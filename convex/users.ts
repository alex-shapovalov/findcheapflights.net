import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  requireClerkId,
  requireIdentity,
  requireServerSecret,
  subscriptionInterval,
  subscriptionStatus,
} from './guards'

const MAX_EMAIL_CHARS = 320
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(value: string | undefined) {
  if (typeof value !== 'string') return undefined
  const email = value.trim().toLowerCase()
  if (email.length > MAX_EMAIL_CHARS || !EMAIL.test(email)) return undefined
  return email
}

export const me = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', identity.subject))
      .unique()
  },
})

export const ensure = mutation({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const clerkId = identity.subject
    const email =
      normalizeEmail(identity.email) ?? normalizeEmail(args.email) ?? undefined

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (existing) {
      if (email && existing.email !== email) {
        await ctx.db.patch(existing._id, { email })
      }
      return existing._id
    }
    return await ctx.db.insert('users', {
      clerkId,
      email,
      lifetimeSearchCount: 0,
      subscriptionStatus: 'none',
    })
  },
})

export const consumeFreeSearch = mutation({
  args: {},
  handler: async ctx => {
    const clerkId = await requireClerkId(ctx)
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('User not found')
    const subscribed =
      (user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'trialing') &&
      (user.currentPeriodEnd == null || user.currentPeriodEnd > Date.now())
    if (subscribed) {
      return { subscribed: true, lifetimeSearchCount: user.lifetimeSearchCount }
    }
    if (user.lifetimeSearchCount >= 1) {
      throw new Error('PAYWALL')
    }
    await ctx.db.patch(user._id, {
      lifetimeSearchCount: user.lifetimeSearchCount + 1,
    })
    return {
      subscribed: false,
      lifetimeSearchCount: user.lifetimeSearchCount + 1,
    }
  },
})

export const syncBilling = mutation({
  args: {
    serverSecret: v.string(),
    clerkId: v.optional(v.string()),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus,
    subscriptionInterval: v.optional(subscriptionInterval),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret)

    const patch = {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionInterval: args.subscriptionInterval,
      currentPeriodEnd: args.currentPeriodEnd,
    }
    const clerkId = args.clerkId
    let user = clerkId
      ? await ctx.db
          .query('users')
          .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
          .unique()
      : null

    if (!user) {
      user = await ctx.db
        .query('users')
        .withIndex('by_stripeCustomerId', q =>
          q.eq('stripeCustomerId', args.stripeCustomerId),
        )
        .unique()
    }

    if (user) {
      await ctx.db.patch(user._id, patch)
      return
    }
    if (!clerkId) return
    await ctx.db.insert('users', {
      clerkId,
      lifetimeSearchCount: 0,
      ...patch,
    })
  },
})
