import { auth, currentUser } from '@clerk/nextjs/server'
import type { Id } from '@/convex/_generated/dataModel'
import { hasActiveAccess, refreshBilling } from '@/lib/billing'
import {
  FREE_SEARCH_LIMIT,
  SEARCH_IP_BURST_LIMIT,
  SEARCH_USER_BURST_LIMIT,
  SUBSCRIBER_MONTHLY_LIMIT,
} from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { applyGuestUsageToUser, getGuestId } from '@/lib/guest'
import { encodeHuntEvent, type HuntClientEvent } from '@/lib/hunt-stream'
import { streamFlightHunt } from '@/lib/openrouter'
import {
  consumeBurst,
  consumeGuestHunt,
  consumeSubscriberSearch,
  refundGuestHunt,
  refundSubscriberSearch,
} from '@/lib/redis'
import { clientIp, isTrustedOrigin } from '@/lib/request'
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

function tooManyRequests(message: string) {
  return Response.json({ error: 'rate_limited', message }, { status: 429 })
}

function publicSearchError(error: unknown) {
  const name = error instanceof Error ? error.name : ''
  if (name === 'TimeoutError' || name === 'AbortError') {
    return 'This search ran too long and stopped before a report came back. Please try again.'
  }
  return 'Something went wrong running this search. Please try again.'
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return Response.json({ error: 'Invalid origin.' }, { status: 403 })
  }

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

  const withinBurst = await consumeBurst([
    { scope: 'search:ip', id: ip, limit: SEARCH_IP_BURST_LIMIT },
    ...(userId
      ? [
          {
            scope: 'search:user',
            id: userId,
            limit: SEARCH_USER_BURST_LIMIT,
          },
        ]
      : []),
  ])
  if (!withinBurst) {
    return tooManyRequests('Too many searches at once. Wait a minute.')
  }

  if (!userId) {
    const guestId = await getGuestId()
    const consumed = await consumeGuestHunt(guestId, ip)
    if (!consumed.allowed) return paywallResponse()
    return huntResponse(payload, {
      onFail: (_message, refundable) =>
        refundable ? refundGuestHunt(guestId, ip) : Promise.resolve(),
    })
  }

  const convex = await getAuthedConvex()
  const user = await currentUser()
  await convex.mutation(api.users.ensure, {
    email: user?.primaryEmailAddress?.emailAddress,
  })

  const profile = await refreshBilling(await convex.query(api.users.me, {}))
  const subscribed = hasActiveAccess(profile)
  const lifetimeUsed = await applyGuestUsageToUser(
    convex,
    profile?.lifetimeSearchCount ?? 0,
    subscribed,
  )

  let refundReservation: (() => Promise<unknown>) | null = null

  if (subscribed) {
    const monthly = await consumeSubscriberSearch(userId)
    if (!monthly.allowed) {
      return Response.json(
        {
          error: 'monthly_limit',
          message: `Pro includes ${SUBSCRIBER_MONTHLY_LIMIT} searches per month. Try again next month.`,
        },
        { status: 429 },
      )
    }
    refundReservation = () => refundSubscriberSearch(userId)
  } else if (lifetimeUsed >= FREE_SEARCH_LIMIT) {
    return paywallResponse()
  } else {
    const guestId = await getGuestId()
    const consumed = await consumeGuestHunt(guestId, ip)
    if (!consumed.allowed) return paywallResponse()
    try {
      await convex.mutation(api.users.consumeFreeSearch, {})
      refundReservation = () => refundGuestHunt(guestId, ip)
    } catch (error) {
      await refundGuestHunt(guestId, ip).catch(() => undefined)
      if (error instanceof Error && error.message.includes('PAYWALL')) {
        return paywallResponse()
      }
      throw error
    }
  }

  const searchId = await convex.mutation(api.searches.create, {
    mode: payload.mode,
    tripType: payload.tripType,
    originAirports: payload.originAirports,
    destinationAirports: payload.destinationAirports,
    continent: payload.continent,
    maxPrice: payload.maxPrice,
    interests: payload.interests,
  })
  return huntResponse(payload, {
    searchId,
    onComplete: result =>
      convex.mutation(api.searches.complete, { id: searchId, result }),
    onFail: async (message, refundable) => {
      if (refundable && refundReservation) {
        await refundReservation().catch(() => undefined)
      }
      await convex
        .mutation(api.searches.fail, { id: searchId, error: message })
        .catch(() => undefined)
    },
  })
}

function huntResponse(
  payload: ReturnType<typeof parseSearchRequest>,
  hooks: {
    searchId?: Id<'searches'>
    onComplete?: (result: string) => Promise<unknown>
    onFail: (message: string, refundable: boolean) => Promise<unknown>
  },
) {
  const encoder = new TextEncoder()
  let report = ''
  let upstream: ReadableStreamDefaultReader<HuntClientEvent> | null = null
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let started = false
      try {
        upstream = (await streamFlightHunt(payload)).getReader()
        started = true
        while (true) {
          const { done, value } = await upstream.read()
          if (done) break
          if (value.type === 'chunk') report += value.text
          controller.enqueue(encoder.encode(encodeHuntEvent(value)))
        }
        if (cancelled) {
          await hooks
            .onFail('Client disconnected', false)
            .catch(() => undefined)
          return
        }
        await hooks.onComplete?.(
          report || 'No fare report was returned. Try again.',
        )
        controller.close()
      } catch (error) {
        console.error('Fare hunt failed', error)
        const message = publicSearchError(error)
        await hooks.onFail(message, !started).catch(() => undefined)
        if (cancelled) return
        try {
          controller.enqueue(
            encoder.encode(
              encodeHuntEvent({ type: 'chunk', text: `\n\n${message}` }),
            ),
          )
          controller.close()
        } catch {
          // the client is already gone; nothing left to report to
        }
      }
    },
    async cancel() {
      cancelled = true
      await upstream?.cancel().catch(() => undefined)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(hooks.searchId ? { 'X-Search-Id': String(hooks.searchId) } : {}),
    },
  })
}
