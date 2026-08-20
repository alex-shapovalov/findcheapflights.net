import { type Infer, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import {
  boundedString,
  consumeWriteBudget,
  MAX_AIRPORTS,
  MAX_ERROR_CHARS,
  MAX_RESULT_CHARS,
  MAX_THEME_CHARS,
  requireClerkId,
  requireServerSecret,
} from './guards'
import { searchMode, tripType } from './schema'

const IATA = /^[A-Z]{3}$/
const GUEST_CLERK_ID = 'guest'

const searchCreateArgs = {
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
}

function iataCodes(codes: string[]) {
  const cleaned = codes
    .map(code => code.trim().toUpperCase())
    .filter(code => IATA.test(code))
  return [...new Set(cleaned)].slice(0, MAX_AIRPORTS)
}

type SearchCreateInput = {
  mode: Infer<typeof searchMode>
  tripType: Infer<typeof tripType>
  originAirports: string[]
  destinationAirports: string[]
  continent?: string
  minPrice?: number
  maxPrice?: number
  dateFrom?: string
  dateTo?: string
  minNights?: number
  maxNights?: number
  interests?: string
}

function searchFields(args: SearchCreateInput, clerkId: string, isGuest: boolean) {
  const originAirports = iataCodes(args.originAirports)
  if (originAirports.length === 0) {
    throw new Error('At least one origin airport is required')
  }

  const fields = {
    clerkId,
    mode: args.mode,
    tripType: args.tripType,
    originAirports,
    destinationAirports: iataCodes(args.destinationAirports),
    continent: args.continent ? boundedString(args.continent, 40) : undefined,
    minPrice: args.minPrice,
    maxPrice: args.maxPrice,
    dateFrom: args.dateFrom,
    dateTo: args.dateTo,
    minNights: args.minNights,
    maxNights: args.maxNights,
    interests: args.interests
      ? boundedString(args.interests, MAX_THEME_CHARS)
      : undefined,
    status: 'running' as const,
  }

  return isGuest ? { ...fields, isGuest: true } : fields
}

function requireGuestSearch(search: Doc<'searches'> | null) {
  if (!search || search.clerkId !== GUEST_CLERK_ID || !search.isGuest) {
    throw new Error('Search not found')
  }
  return search
}

export const create = mutation({
  args: searchCreateArgs,
  handler: async (ctx, args) => {
    const clerkId = await requireClerkId(ctx)
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .unique()
    if (!user) throw new Error('User not found')
    await consumeWriteBudget(ctx, user)

    return await ctx.db.insert('searches', searchFields(args, clerkId, false))
  },
})

export const createGuest = mutation({
  args: {
    serverSecret: v.string(),
    ...searchCreateArgs,
  },
  returns: v.id('searches'),
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret)
    const { serverSecret: _serverSecret, ...searchArgs } = args
    return await ctx.db.insert(
      'searches',
      searchFields(searchArgs, GUEST_CLERK_ID, true),
    )
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

export const completeGuest = mutation({
  args: {
    serverSecret: v.string(),
    id: v.id('searches'),
    result: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret)
    const search = requireGuestSearch(await ctx.db.get(args.id))
    if (search.status !== 'running') {
      throw new Error('Search is already finished')
    }
    await ctx.db.patch(args.id, {
      status: 'complete',
      result: boundedString(args.result, MAX_RESULT_CHARS),
    })
    return null
  },
})

export const failGuest = mutation({
  args: {
    serverSecret: v.string(),
    id: v.id('searches'),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret)
    const search = requireGuestSearch(await ctx.db.get(args.id))
    if (search.status !== 'running') {
      throw new Error('Search is already finished')
    }
    await ctx.db.patch(args.id, {
      status: 'failed',
      error: boundedString(args.error, MAX_ERROR_CHARS),
    })
    return null
  },
})

export const listMine = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const searches = await ctx.db
      .query('searches')
      .withIndex('by_clerkId', q => q.eq('clerkId', identity.subject))
      .order('desc')
      .take(30)
    return searches.filter(search => !search.isGuest)
  },
})

export const getMine = query({
  args: { id: v.id('searches') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const search = await ctx.db.get(args.id)
    if (!search || search.isGuest || search.clerkId !== identity.subject) {
      return null
    }
    return search
  },
})
