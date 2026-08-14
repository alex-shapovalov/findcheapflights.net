'use client'

import { SignInButton, useUser } from '@clerk/nextjs'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SearchReport } from '@/components/search-report'
import { nearbyAirports } from '@/lib/airports'
import { cn } from '@/lib/cn'
import type { Continent, TravelThemeId } from '@/lib/constants'
import {
  CONTINENTS,
  FREE_SEARCH_LIMIT,
  PLANS,
  SUBSCRIBER_DAILY_LIMIT,
  TRAVEL_THEMES,
} from '@/lib/constants'
import type {
  QuotaState,
  SearchMode,
  SearchRequest,
  TripType,
} from '@/lib/types'
import { AirportPicker } from './airport-picker'

const emptyQuota: QuotaState = {
  subscribed: false,
  lifetimeUsed: 0,
  dailyUsed: 0,
  dailyLimit: SUBSCRIBER_DAILY_LIMIT,
  remaining: FREE_SEARCH_LIMIT,
  paywalled: false,
}

export function SearchForm() {
  const { isSignedIn } = useUser()
  const [mode, setMode] = useState<SearchMode>('flexible_destination')
  const [tripType, setTripType] = useState<TripType>('round_trip')
  const [originAirports, setOriginAirports] = useState<string[]>([])
  const [destinationAirports, setDestinationAirports] = useState<string[]>([])
  const [continent, setContinent] = useState<Continent>('Europe')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minNights, setMinNights] = useState('3')
  const [maxNights, setMaxNights] = useState('10')
  const [theme, setTheme] = useState<TravelThemeId | null>(null)
  const [quota, setQuota] = useState<QuotaState>(emptyQuota)
  const [report, setReport] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(
    'idle',
  )
  const [error, setError] = useState('')
  const [paywall, setPaywall] = useState(false)
  const outcomeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refreshQuota()
  }, [isSignedIn])

  useEffect(() => {
    if (status !== 'running') return
    window.history.replaceState(null, '', '#report')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    outcomeRef.current?.scrollIntoView({
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [status])

  async function refreshQuota() {
    const response = await fetch('/api/me')
    if (!response.ok) return null
    const next = (await response.json()) as QuotaState
    setQuota(next)
    setPaywall(next.paywalled)
    return next
  }

  function addNearby() {
    const extra = nearbyAirports(originAirports).map(airport => airport.iata)
    setOriginAirports([...new Set([...originAirports, ...extra])].slice(0, 12))
  }

  async function startCheckout(interval: 'month' | 'year') {
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
    setError(data.error ?? 'Could not start checkout.')
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setPaywall(false)
    setReport('')
    setStatus('running')

    const payload: SearchRequest = {
      mode,
      tripType,
      originAirports,
      destinationAirports:
        mode === 'flexible_origin' ? destinationAirports : [],
      continent: mode === 'flexible_destination' ? continent : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minNights:
        tripType === 'round_trip' && minNights ? Number(minNights) : undefined,
      maxNights:
        tripType === 'round_trip' && maxNights ? Number(maxNights) : undefined,
      interests: theme ?? undefined,
    }

    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 401) {
      setStatus('error')
      setError('Sign in to run a fare hunt.')
      return
    }
    if (response.status === 402) {
      setStatus('idle')
      setPaywall(true)
      await refreshQuota()
      return
    }
    if (response.status === 429) {
      const data = (await response.json()) as { message?: string }
      setStatus('error')
      setError(data.message ?? 'Daily search limit reached.')
      await refreshQuota()
      return
    }
    if (!response.ok || !response.body) {
      const data = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      setStatus('error')
      setError(data?.error ?? 'Search failed.')
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
      setReport(text)
    }
    setStatus('done')
    await refreshQuota()
  }

  const hasOutcome =
    paywall || Boolean(error) || status === 'running' || Boolean(report)

  return (
    <div className="space-y-8">
      <form
        autoComplete="off"
        onSubmit={onSubmit}
        className="rounded-3xl border border-line bg-panel/90 p-4 shadow-(--elev) sm:p-8"
      >
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              ['flexible_destination', 'Nearby airports + continent'],
              ['flexible_origin', 'Fixed destination'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'rounded-full border px-3 py-2 text-xs sm:px-4 sm:text-sm',
                mode === value
                  ? 'border-gold bg-gold text-on-gold'
                  : 'border-line text-mute hover:text-foam',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5">
          <AirportPicker
            label={
              mode === 'flexible_origin'
                ? 'Home / nearby origins'
                : 'Airports near you'
            }
            values={originAirports}
            onChange={setOriginAirports}
            placeholder="Pittsburgh, Cleveland, IAD..."
          />
          <button
            type="button"
            onClick={addNearby}
            className="w-fit text-xs uppercase tracking-[0.16em] text-teal hover:text-gold"
          >
            Add airports within ~6 hours
          </button>

          {mode === 'flexible_destination' ? (
            <label className="block space-y-2">
              <span className="block text-xs uppercase tracking-[0.18em] text-mute">
                Destination continent
              </span>
              <select
                value={continent}
                onChange={event =>
                  setContinent(event.target.value as Continent)
                }
                className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 outline-none"
              >
                {CONTINENTS.map(item => (
                  <option key={item} value={item}>
                    {item} (destination variable)
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <AirportPicker
              label="Destination"
              values={destinationAirports}
              onChange={setDestinationAirports}
              placeholder="IBZ, AMS, LIS..."
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-xs uppercase tracking-[0.18em] text-mute">
                Trip
              </legend>
              <div className="flex gap-2">
                {(
                  [
                    ['round_trip', 'Round trip'],
                    ['one_way', 'One way'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTripType(value)}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2 text-sm',
                      tripType === value
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-line text-mute',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Min $"
                value={minPrice}
                onChange={setMinPrice}
              />
              <NumberField
                label="Max $"
                value={maxPrice}
                onChange={setMaxPrice}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label="Search from"
              value={dateFrom}
              onChange={setDateFrom}
            />
            <DateField
              label="Search until"
              value={dateTo}
              onChange={setDateTo}
            />
          </div>

          {tripType === 'round_trip' && (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Min nights"
                value={minNights}
                onChange={setMinNights}
              />
              <NumberField
                label="Max nights"
                value={maxNights}
                onChange={setMaxNights}
              />
            </div>
          )}

          <div className="space-y-2">
            <span className="block text-xs uppercase tracking-[0.18em] text-mute">
              Make it compelling
            </span>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_THEMES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={theme === item.id}
                  onClick={() =>
                    setTheme(current => (current === item.id ? null : item.id))
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    theme === item.id
                      ? 'border-gold text-gold'
                      : 'border-line text-mute hover:text-foam',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-mute">
              Optional. Pick one to weight destinations and dates toward a
              theme.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-mute">
            {quota.subscribed
              ? `${quota.remaining} of ${quota.dailyLimit} Pro searches left today`
              : quota.paywalled
                ? 'Free hunt used, purchase Pro to unlock 25 searches/day'
                : `${quota.remaining} free hunt remaining`}
          </p>
          {isSignedIn || (!quota.paywalled && quota.remaining > 0) ? (
            <button
              type="submit"
              disabled={status === 'running'}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-medium text-on-gold disabled:opacity-60 sm:w-auto"
            >
              {status === 'running' && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}
              {status === 'running' ? 'Hunting live fares...' : 'Hunt fares'}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full rounded-full bg-gold px-6 py-3 font-medium text-on-gold sm:w-auto"
              >
                Sign in to hunt
              </button>
            </SignInButton>
          )}
        </div>
      </form>

      {hasOutcome && (
        <div id="report" ref={outcomeRef} className="scroll-mt-20 space-y-8">
          {paywall && (
            <div className="rounded-3xl border border-gold/40 bg-panel p-6">
              <h2 className="font-display text-2xl text-gold">
                Your free hunt is used
              </h2>
              <p className="mt-2 max-w-xl text-mute">
                {`Pro includes 25 cheap flight hunts per day.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {isSignedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => startCheckout('month')}
                      className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold"
                    >
                      ${PLANS.monthly.amountUsd} / month
                    </button>
                    <button
                      type="button"
                      onClick={() => startCheckout('year')}
                      className="rounded-full border border-gold px-5 py-2 text-sm text-gold"
                    >
                      ${PLANS.yearly.amountUsd} / year
                    </button>
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-on-gold"
                    >
                      Sign in to unlock Pro
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {(status === 'running' || report) && (
            <SearchReport text={report} running={status === 'running'} />
          )}
        </div>
      )}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs uppercase tracking-[0.18em] text-mute">
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 outline-none"
      />
    </label>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs uppercase tracking-[0.18em] text-mute">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 outline-none"
      />
    </label>
  )
}
