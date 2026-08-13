import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { searchMode, tripType } from './schema'

async function requireClerkId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
}) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')
  return identity.subject
}

export const create = mutation({
  args: {
    mode: searchMode,
    tripType,
    originAirports: v.array(v.string()),
    destinationAirports: v.array(v.string()),
    continent: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    minNights: v.optional(v.number()),
    maxNights: v.optional(v.number()),
    interests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx)
    return await ctx.db.insert('searches', {
      clerkId,
      ...args,
      status: 'running',
    })
  },
})

export const complete = mutation({
  args: {
    id: v.id('searches'),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx)
    const search = await ctx.db.get(args.id)
    if (!search || search.clerkId !== clerkId) {
      throw new Error('Search not found')
    }
    await ctx.db.patch(args.id, {
      status: 'complete',
      result: args.result,
    })
  },
})

export const fail = mutation({
  args: {
    id: v.id('searches'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx)
    const search = await ctx.db.get(args.id)
    if (!search || search.clerkId !== clerkId) {
      throw new Error('Search not found')
    }
    await ctx.db.patch(args.id, {
      status: 'failed',
      error: args.error,
    })
  },
})

export const listMine = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return await ctx.db
      .query('searches')
      .withIndex('by_clerkId', q => q.eq('clerkId', identity.subject))
      .order('desc')
      .take(30)
  },
})

export const getMine = query({
  args: { id: v.id('searches') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const search = await ctx.db.get(args.id)
    if (!search || search.clerkId !== identity.subject) return null
    return search
  },
})
