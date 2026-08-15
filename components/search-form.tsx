'use client'

import { SignInButton, useUser } from '@clerk/nextjs'
import { LoaderCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchReport } from '@/components/search-report'
import { nearbyAirports } from '@/lib/airports'
import { cn } from '@/lib/cn'
import type { Continent, TravelThemeId } from '@/lib/constants'
import {
  CONTINENTS,
  FREE_SEARCH_LIMIT,
  PLANS,
  SEARCH_HORIZON_MONTHS,
  SUBSCRIBER_MONTHLY_LIMIT,
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
  monthlyUsed: 0,
  monthlyLimit: SUBSCRIBER_MONTHLY_LIMIT,
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

  const refreshQuota = useCallback(async () => {
    const response = await fetch('/api/me')
    if (!response.ok) return null
    const next = (await response.json()) as QuotaState
    setQuota(next)
    setPaywall(next.paywalled)
    return next
  }, [])

  useEffect(() => {
    void isSignedIn
    void refreshQuota()
  }, [isSignedIn, refreshQuota])

  useEffect(() => {
    if (status !== 'running') return
    window.history.replaceState(null, '', '#report')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    outcomeRef.current?.scrollIntoView({
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [status])

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

  const today = localIsoDate()
  const latest = addLocalMonths(today, SEARCH_HORIZON_MONTHS)

  function onDateFromChange(value: string) {
    setDateFrom(value)
    if (value && dateTo && value > dateTo) setDateTo(value)
  }

  function onDateToChange(value: string) {
    setDateTo(value)
    if (value && dateFrom && value < dateFrom) setDateFrom(value)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const dateError = invalidSearchDates(dateFrom, dateTo, today, latest)
    if (dateError) {
      setError(dateError)
      setStatus('error')
      return
    }
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
      setError(data.message ?? 'Monthly search limit reached.')
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
              min={today}
              max={dateTo || latest}
              onChange={onDateFromChange}
            />
            <DateField
              label="Search until"
              value={dateTo}
              min={dateFrom || today}
              max={latest}
              onChange={onDateToChange}
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
              ? `${quota.remaining} of ${quota.monthlyLimit} Pro searches left this month`
              : quota.paywalled
                ? `Free hunt used, purchase Pro to unlock ${SUBSCRIBER_MONTHLY_LIMIT} searches/month`
                : `${quota.remaining} free hunt remaining`}
          </p>
          {quota.subscribed || (!quota.paywalled && quota.remaining > 0) ? (
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
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={() => startCheckout('month')}
              className="w-full rounded-full bg-gold px-6 py-3 font-medium text-on-gold sm:w-auto"
            >
              Get Pro
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full rounded-full bg-gold px-6 py-3 font-medium text-on-gold sm:w-auto"
              >
                Sign in to unlock Pro
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
                {`Pro includes ${SUBSCRIBER_MONTHLY_LIMIT} cheap flight hunts per month.`}
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
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
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
        min={min}
        max={max}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 outline-none"
      />
    </label>
  )
}

function localIsoDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addLocalMonths(iso: string, months: number) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setMonth(date.getMonth() + months)
  return localIsoDate(date)
}

function invalidSearchDates(
  dateFrom: string,
  dateTo: string,
  today: string,
  latest: string,
) {
  if (dateFrom && dateFrom < today) return 'Search from cannot be in the past'
  if (dateTo && dateTo < today) return 'Search until cannot be in the past'
  if (dateFrom && dateFrom > latest) {
    return 'Search from is too far in the future'
  }
  if (dateTo && dateTo > latest) {
    return 'Search until is too far in the future'
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return 'Search from must be on or before search until'
  }
  return ''
}
