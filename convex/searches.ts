import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  boundedString,
  consumeWriteBudget,
  MAX_AIRPORTS,
  MAX_ERROR_CHARS,
  MAX_INTERESTS_CHARS,
  MAX_RESULT_CHARS,
  requireClerkId,
} from './guards'
import { searchMode, tripType } from './schema'

const IATA = /^[A-Z]{3}$/

function iataCodes(codes: string[]) {
  const cleaned = codes
    .map(code => code.trim().toUpperCase())
    .filter(code => IATA.test(code))
  return [...new Set(cleaned)].slice(0, MAX_AIRPORTS)
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
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('User not found')
    await consumeWriteBudget(ctx, user)

    const originAirports = iataCodes(args.originAirports)
    if (originAirports.length === 0) {
      throw new Error('At least one origin airport is required')
    }

    return await ctx.db.insert('searches', {
      ...args,
      clerkId,
      originAirports,
      destinationAirports: iataCodes(args.destinationAirports),
      continent: args.continent ? boundedString(args.continent, 40) : undefined,
      interests: args.interests
        ? boundedString(args.interests, MAX_INTERESTS_CHARS)
        : undefined,
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
    if (search.status !== 'running') {
      throw new Error('Search is already finished')
    }
    await ctx.db.patch(args.id, {
      status: 'complete',
      result: boundedString(args.result, MAX_RESULT_CHARS),
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
    if (search.status !== 'running') {
      throw new Error('Search is already finished')
    }
    await ctx.db.patch(args.id, {
      status: 'failed',
      error: boundedString(args.error, MAX_ERROR_CHARS),
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
