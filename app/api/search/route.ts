import { auth, currentUser } from '@clerk/nextjs/server'
import type { Id } from '@/convex/_generated/dataModel'
import { hasActiveAccess, refreshBilling } from '@/lib/billing'
import { FREE_SEARCH_LIMIT, SUBSCRIBER_DAILY_LIMIT } from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { applyGuestUsageToUser, clientIp, getGuestId } from '@/lib/guest'
import { streamFlightHunt } from '@/lib/openrouter'
import {
  consumeGuestHunt,
  consumeSubscriberSearch,
  refundGuestHunt,
  refundSubscriberSearch,
} from '@/lib/redis'
import { parseSearchRequest } from '@/lib/validate'

export const runtime = 'nodejs'
export const maxDuration = 300

function paywallResponse() {
  return Response.json(
    {
      error: 'paywall',
      message: `You used your ${FREE_SEARCH_LIMIT} free search. Sign in and subscribe to keep hunting.`,
    },
    { status: 402 },
  )
}

export async function POST(request: Request) {
  let payload: ReturnType<typeof parseSearchRequest>
  try {
    payload = parseSearchRequest(await request.json())
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid search' },
      { status: 400 },
    )
  }

  const { userId } = await auth()
  const ip = clientIp(request)

  if (!userId) {
    const guestId = await getGuestId()
    const consumed = await consumeGuestHunt(guestId, ip)
    if (!consumed.allowed) return paywallResponse()
    return huntResponse(payload, {
      onFail: () => refundGuestHunt(guestId, ip),
    })
  }

  const convex = await getAuthedConvex()
  const user = await currentUser()
  await convex.mutation(api.users.ensure, {
    email: user?.primaryEmailAddress?.emailAddress,
  })

  const profile = await refreshBilling(
    convex,
    await convex.query(api.users.me, {}),
  )
  const subscribed = hasActiveAccess(profile)
  const lifetimeUsed = await applyGuestUsageToUser(
    convex,
    profile?.lifetimeSearchCount ?? 0,
    subscribed,
  )

  let reservedSubscriberSlot = false
  if (subscribed) {
    const daily = await consumeSubscriberSearch(userId)
    if (!daily.allowed) {
      return Response.json(
        {
          error: 'daily_limit',
          message: `Pro includes ${SUBSCRIBER_DAILY_LIMIT} searches per day. Try again tomorrow.`,
        },
        { status: 429 },
      )
    }
    reservedSubscriberSlot = true
  } else if (lifetimeUsed >= FREE_SEARCH_LIMIT) {
    return paywallResponse()
  } else {
    try {
      await convex.mutation(api.users.consumeFreeSearch, {})
    } catch (error) {
      if (error instanceof Error && error.message.includes('PAYWALL')) {
        return paywallResponse()
      }
      throw error
    }
  }

  const searchId = await convex.mutation(api.searches.create, payload)
  return huntResponse(payload, {
    searchId,
    onComplete: result =>
      convex.mutation(api.searches.complete, { id: searchId, result }),
    onFail: async message => {
      if (reservedSubscriberSlot) {
        await refundSubscriberSearch(userId).catch(() => undefined)
      }
      await convex.mutation(api.searches.fail, { id: searchId, error: message })
    },
  })
}

function huntResponse(
  payload: ReturnType<typeof parseSearchRequest>,
  hooks: {
    searchId?: Id<'searches'>
    onComplete?: (result: string) => Promise<unknown>
    onFail: (message: string) => Promise<unknown>
  },
) {
  const encoder = new TextEncoder()
  let report = ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const upstream = await streamFlightHunt(payload)
        const reader = upstream.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          report += value
          controller.enqueue(encoder.encode(value))
        }
        await hooks.onComplete?.(report || 'No fare report was returned.')
        controller.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Search failed'
        await hooks.onFail(message).catch(() => undefined)
        controller.enqueue(encoder.encode(`\n\nSearch failed: ${message}`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(hooks.searchId ? { 'X-Search-Id': String(hooks.searchId) } : {}),
    },
  })
}
