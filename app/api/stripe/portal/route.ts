import { auth } from '@clerk/nextjs/server'
import { APP_URL } from '@/lib/constants'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json(
      { error: 'Sign in to manage billing.' },
      { status: 401 },
    )
  }

  const convex = await getAuthedConvex()
  const profile = await convex.query(api.users.me, {})
  if (!profile?.stripeCustomerId) {
    return Response.json({ error: 'No billing account yet.' }, { status: 400 })
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${APP_URL}/pricing`,
  })

  return Response.json({ url: portal.url })
}
