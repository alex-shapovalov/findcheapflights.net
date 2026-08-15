import { auth, currentUser } from '@clerk/nextjs/server'
import { APP_URL } from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { getStripe, priceIdForInterval } from '@/lib/stripe'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Sign in to subscribe.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as {
    interval?: string
  } | null
  const interval = body?.interval
  if (interval !== 'month' && interval !== 'year') {
    return Response.json({ error: 'Invalid interval.' }, { status: 400 })
  }
  const convex = await getAuthedConvex()
  const clerkUser = await currentUser()
  await convex.mutation(api.users.ensure, {
    email: clerkUser?.primaryEmailAddress?.emailAddress,
  })
  const profile = await convex.query(api.users.me, {})
  const stripe = getStripe()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  const price = priceIdForInterval(interval)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/pricing`,
    client_reference_id: userId,
    metadata: { clerkId: userId },
    subscription_data: {
      metadata: { clerkId: userId },
    },
    allow_promotion_codes: true,
    integration_identifier: `fcf-sub-${crypto.randomUUID().slice(0, 8)}`,
    ...(profile?.stripeCustomerId
      ? { customer: profile.stripeCustomerId }
      : email
        ? { customer_email: email }
        : {}),
  } as Parameters<typeof stripe.checkout.sessions.create>[0])

  if (!session.url) {
    return Response.json(
      { error: 'Could not start checkout.' },
      { status: 500 },
    )
  }
  return Response.json({ url: session.url })
}
