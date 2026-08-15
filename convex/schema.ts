import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const searchMode = v.union(
  v.literal('flexible_destination'),
  v.literal('flexible_origin'),
)

export const tripType = v.union(v.literal('round_trip'), v.literal('one_way'))

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionInterval: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    lifetimeSearchCount: v.number(),
    writeWindowStart: v.optional(v.number()),
    writeWindowCount: v.optional(v.number()),
  })
    .index('by_clerkId', ['clerkId'])
    .index('by_stripeCustomerId', ['stripeCustomerId'])
    .index('by_stripeSubscriptionId', ['stripeSubscriptionId']),

  searches: defineTable({
    clerkId: v.string(),
    mode: searchMode,
    tripType,
    originAirports: v.array(v.string()),
    destinationAirports: v.array(v.string()),
    continent: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    interests: v.optional(v.string()),
    status: v.union(
      v.literal('running'),
      v.literal('complete'),
      v.literal('failed'),
    ),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index('by_clerkId', ['clerkId']),
})
