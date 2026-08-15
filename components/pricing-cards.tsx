'use client'

import { SignInButton, useAuth } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { PLANS } from '@/lib/constants'

export function PricingCards() {
  const { isSignedIn } = useAuth()
  const user = useQuery(api.users.me)
  const subscribed = Boolean(
    user &&
      (user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'trialing') &&
      (user.currentPeriodEnd == null || user.currentPeriodEnd > Date.now()),
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'month' | 'year' | 'portal' | null>(null)

  async function checkout(interval: 'month' | 'year') {
    setBusy(interval)
    setError('')
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval }),
    })
    const data = (await response.json()) as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
      return
    }
    setBusy(null)
    setError(data.error ?? 'Could not start checkout.')
  }

  async function portal() {
    setBusy('portal')
    setError('')
    const response = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = (await response.json()) as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
      return
    }
    setBusy(null)
    setError(data.error ?? 'No billing portal yet.')
  }

  if (isSignedIn && user === undefined) {
    return null
  }

  if (subscribed) {
    return (
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Pro</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          You are already on Pro.
        </h1>
        <p className="mt-4 text-mute">
          Update your payment method, switch plans, or cancel from the billing
          portal.
        </p>
        <button
          type="button"
          onClick={portal}
          className="mt-8 rounded-full bg-gold px-6 py-3 font-medium text-on-gold"
        >
          {busy === 'portal' ? 'Opening portal...' : 'Manage billing'}
        </button>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Pro</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        One free cheap-flight hunt. Then 100 a month.
      </h1>
      <p className="mt-4 max-w-2xl text-mute">
        Every aaccount a free trial to test us out. Subscribe for $11.99/month
        or $119.99/year to keep hunting; no GDS, just aggresive searching to get
        you the best deals.
      </p>
      <div className="mt-10 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <PlanCard
            name={PLANS.monthly.name}
            price={`$${PLANS.monthly.amountUsd}`}
            cadence="per month"
            cta={busy === 'month' ? 'Redirecting...' : 'Start monthly'}
            featured={false}
            signedIn={Boolean(isSignedIn)}
            onClick={() => checkout('month')}
          />
          <PlanCard
            name={PLANS.yearly.name}
            price={`$${PLANS.yearly.amountUsd}`}
            cadence="per year"
            cta={busy === 'year' ? 'Redirecting...' : 'Start yearly'}
            featured
            signedIn={Boolean(isSignedIn)}
            onClick={() => checkout('year')}
          />
        </div>
        {!isSignedIn && (
          <p className="text-sm text-mute">
            <SignInButton mode="modal">
              <button type="button" className="text-gold underline">
                Sign in
              </button>
            </SignInButton>{' '}
            first. Checkout needs an account so we can attach your{' '}
            {PLANS.monthly.searchesPerMonth} monthly hunts.
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  )
}

function PlanCard({
  name,
  price,
  cadence,
  note,
  cta,
  featured,
  signedIn,
  onClick,
}: {
  name: string
  price: string
  cadence: string
  note?: string
  cta: string
  featured: boolean
  signedIn: boolean
  onClick: () => void
}) {
  const buttonClass =
    'w-full rounded-full bg-gold py-3 font-medium text-on-gold'

  return (
    <div
      className={
        featured
          ? 'flex h-full flex-col rounded-3xl border border-gold bg-panel p-6'
          : 'flex h-full flex-col rounded-3xl border border-line bg-panel p-6'
      }
    >
      <p className="text-xs uppercase tracking-[0.2em] text-mute">{name}</p>
      <p className="mt-3 font-display text-4xl text-gold sm:text-5xl">
        {price}
        <span className="ml-2 text-lg text-mute">{cadence}</span>
      </p>
      {note && <p className="mt-2 text-sm text-teal">{note}</p>}
      <ul className="mt-6 space-y-2 text-sm text-foam/90">
        <li>{PLANS.monthly.searchesPerMonth} live fare hunts per month</li>
        <li>Flexible origins or destinations</li>
        <li>Round trip or one way, with price bounds</li>
        <li>Saved search history</li>
        <li>Cancel anytime</li>
      </ul>
      <div className="mt-auto pt-6">
        {signedIn ? (
          <button type="button" onClick={onClick} className={buttonClass}>
            {cta}
          </button>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className={buttonClass}>
              Sign in to subscribe
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  )
}
