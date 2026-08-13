import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

async function requireClerkId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity.subject
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
    const clerkId = await requireClerkId(ctx)
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (existing) {
      if (args.email && existing.email !== args.email) {
        await ctx.db.patch(existing._id, { email: args.email })
      }
      return existing._id
    }
    return await ctx.db.insert('users', {
      clerkId,
      email: args.email,
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

export const applyStripeEvent = mutation({
  args: {
    webhookSecret: v.string(),
    clerkId: v.optional(v.string()),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.string(),
    subscriptionInterval: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (
      !process.env.STRIPE_WEBHOOK_SECRET ||
      args.webhookSecret !== process.env.STRIPE_WEBHOOK_SECRET
    ) {
      throw new Error('Unauthorized')
    }

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

export const saveBilling = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.string(),
    subscriptionInterval: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx)
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('User not found')
    await ctx.db.patch(user._id, args)
  },
})
