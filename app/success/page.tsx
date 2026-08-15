import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { syncBilling } from '@/lib/billing'
import { api, getAuthedConvex } from '@/lib/convex-server'
import { noIndexMetadata } from '@/lib/seo'
import { billingFromSubscription, getStripe } from '@/lib/stripe'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Pro is active',
  description: 'Your findcheapflights.ai Pro plan is active.',
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  const { userId } = await auth()

  if (userId && typeof sessionId === 'string') {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
    if (
      session.client_reference_id === userId &&
      session.status === 'complete' &&
      session.subscription &&
      typeof session.subscription !== 'string'
    ) {
      const convex = await getAuthedConvex()
      await convex.mutation(api.users.ensure, {})
      await syncBilling(userId, billingFromSubscription(session.subscription))
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-20">
      <p className="text-xs uppercase tracking-[0.28em] text-teal">
        You&apos;re in
      </p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">Pro is active.</h1>
      <p className="mt-4 text-mute">
        You now have 100 live fare hunts per month.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-gold px-6 py-3 font-medium text-on-gold"
      >
        Hunt fares
      </Link>
    </div>
  )
}
