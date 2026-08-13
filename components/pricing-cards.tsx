'use client'

import { SignInButton, useAuth } from '@clerk/nextjs'
import { useState } from 'react'
import { PLANS } from '@/lib/constants'

export function PricingCards() {
  const { isSignedIn } = useAuth()
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

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <PlanCard
          name={PLANS.monthly.name}
          price="$5"
          cadence="per month"
          cta={busy === 'month' ? 'Redirecting...' : 'Start monthly'}
          featured={false}
          signedIn={Boolean(isSignedIn)}
          onClick={() => checkout('month')}
        />
        <PlanCard
          name={PLANS.yearly.name}
          price="$50"
          cadence="per year"
          note="Two months free"
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
          first — checkout needs an account so we can attach your 25 daily
          hunts.
        </p>
      )}
      {isSignedIn && (
        <button
          type="button"
          onClick={portal}
          className="text-sm text-mute underline hover:text-foam"
        >
          {busy === 'portal' ? 'Opening portal...' : 'Manage billing'}
        </button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
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
  return (
    <div
      className={
        featured
          ? 'rounded-3xl border border-gold bg-panel p-6'
          : 'rounded-3xl border border-line bg-panel p-6'
      }
    >
      <p className="text-xs uppercase tracking-[0.2em] text-mute">{name}</p>
      <p className="mt-3 font-display text-4xl text-gold sm:text-5xl">
        {price}
        <span className="ml-2 text-lg text-mute">{cadence}</span>
      </p>
      {note && <p className="mt-2 text-sm text-teal">{note}</p>}
      <ul className="mt-6 space-y-2 text-sm text-foam/90">
        <li>25 live fare hunts per day</li>
        <li>Flexible origins or destinations</li>
        <li>Round trip or one way, with price bounds</li>
        <li>Saved search history</li>
      </ul>
      {signedIn ? (
        <button
          type="button"
          onClick={onClick}
          className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-on-gold"
        >
          {cta}
        </button>
      ) : (
        <SignInButton mode="modal">
          <button
            type="button"
            className="mt-6 w-full rounded-full bg-gold py-3 font-medium text-on-gold"
          >
            Sign in to subscribe
          </button>
        </SignInButton>
      )}
    </div>
  )
}
