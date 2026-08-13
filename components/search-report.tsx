'use client'

import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  ExternalLink,
  Ticket,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  type CheckedFare,
  type DealLabel,
  type DealRating,
  type FareDeal,
  hasReportContent,
  type PartialFareReport,
  parseFareReport,
  type ReportVerdict,
} from '@/lib/report'

const RATING_TONE: Record<DealRating, string> = {
  INTERESTING: 'border-line text-mute',
  GOOD: 'border-teal/50 text-teal',
  VERY_GOOD: 'border-teal bg-teal/10 text-teal',
  EXCELLENT: 'border-gold/60 text-gold',
  EXCEPTIONAL: 'border-gold bg-gold/15 text-gold',
  EXTREME: 'border-gold bg-gold text-on-gold',
}

const RATING_TEXT: Record<DealRating, string> = {
  INTERESTING: 'Interesting',
  GOOD: 'Good',
  VERY_GOOD: 'Very good',
  EXCELLENT: 'Excellent',
  EXCEPTIONAL: 'Exceptional',
  EXTREME: 'Extreme',
}

const LABEL_TEXT: Record<DealLabel, string> = {
  CHEAPEST_OVERALL: 'Cheapest overall',
  BEST_VALUE: 'Best value',
  EVENT_JACKPOT: 'Event jackpot',
}

export function SearchReport({
  text,
  running,
}: {
  text: string
  running?: boolean
}) {
  const parsed = parseFareReport(text)
  const report = parsed && hasReportContent(parsed) ? parsed : null

  return (
    <section className="rounded-3xl border border-line bg-panel p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl sm:text-2xl">Fare report</h2>
        {running && (
          <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-teal">
            Searching live sources
          </span>
        )}
      </div>
      {report ? (
        <StructuredReport report={report} />
      ) : (
        <RawReport text={text} running={running} />
      )}
    </section>
  )
}

function StructuredReport({ report }: { report: PartialFareReport }) {
  const deals = report.deals ?? []
  const alsoChecked = (report.alsoChecked ?? []).filter(item => item.route)
  const recommendations = report.recommendations ?? []
  const limitations = report.limitations ?? []

  return (
    <div className="space-y-8">
      <div>
        {report.verdict && <VerdictPill verdict={report.verdict} />}
        {report.headline && (
          <p className="mt-3 font-display text-2xl leading-snug text-foam sm:text-3xl">
            {report.headline}
          </p>
        )}
        {report.summary && (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-foam/80">
            {report.summary}
          </p>
        )}
      </div>

      {deals.length > 0 && (
        <div className="space-y-4">
          {deals.map((deal, index) => (
            <DealCard
              key={`${deal.originAirport}-${deal.destinationAirport}-${deal.departDate}-${index}`}
              deal={deal}
            />
          ))}
        </div>
      )}

      {alsoChecked.length > 0 && <AlsoChecked items={alsoChecked} />}

      {recommendations.length > 0 && (
        <Notes title="What to do next" items={recommendations} tone="foam" />
      )}

      {limitations.length > 0 && (
        <Notes title="Coverage and caveats" items={limitations} tone="mute" />
      )}
    </div>
  )
}

function VerdictPill({ verdict }: { verdict: ReportVerdict }) {
  const found = verdict === 'deals_found'
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em]',
        found ? 'border-go/50 text-go' : 'border-gold/50 text-gold',
      )}
    >
      {found ? 'Deals found' : 'Closest fares'}
    </span>
  )
}

function DealCard({ deal }: { deal: Partial<FareDeal> }) {
  const rating = deal.rating
  const labels = deal.labels ?? []
  const warnings = deal.warnings ?? []
  const price = formatUsd(deal.priceUsd)

  return (
    <article className="rounded-2xl border border-line bg-panel/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-lg">
            {deal.originAirport && (
              <span className="font-medium text-foam">
                {deal.originAirport}
              </span>
            )}
            {deal.originAirport &&
              (deal.destinationAirport || deal.destinationCity) && (
                <ArrowRight className="h-4 w-4 text-mute" />
              )}
            {deal.destinationAirport && (
              <span className="font-medium text-foam">
                {deal.destinationAirport}
              </span>
            )}
            {deal.destinationCity && (
              <span className="text-mute">{deal.destinationCity}</span>
            )}
            {!deal.originAirport &&
              !deal.destinationAirport &&
              !deal.destinationCity && (
                <span className="font-medium text-foam">Fare</span>
              )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {rating && (
              <span
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.14em]',
                  RATING_TONE[rating],
                )}
              >
                {RATING_TEXT[rating]}
              </span>
            )}
            {labels.map(label => (
              <span
                key={label}
                className="rounded-full border border-gold/50 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-gold"
              >
                {LABEL_TEXT[label]}
              </span>
            ))}
            {deal.aboveRequestedCap && (
              <span className="rounded-full border border-danger/40 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-danger">
                Above your cap
              </span>
            )}
            {deal.verifiedLive === true && (
              <span className="inline-flex items-center gap-1 rounded-full border border-go/40 px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-go">
                <CircleCheck className="h-3 w-3" />
                Verified live
              </span>
            )}
            {deal.verifiedLive === false && (
              <span className="rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-mute">
                Unverified
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {price && (
            <p className="font-display text-3xl text-gold sm:text-4xl">
              {price}
              {deal.tripType === 'one_way' && (
                <span className="ml-2 align-middle text-xs uppercase tracking-[0.16em] text-mute">
                  one way
                </span>
              )}
            </p>
          )}
          {deal.priceOriginal && (
            <p className="mt-1 text-xs text-mute">{deal.priceOriginal}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-foam/90">
        <CalendarDays className="h-4 w-4 text-teal" />
        <span>{dateRange(deal.departDate, deal.returnDate)}</span>
        {deal.nights != null && (
          <span className="text-mute">· {deal.nights} nights</span>
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <Fact label="Airlines" value={joinList(deal.airlines)} />
        <Fact label="Routing" value={routing(deal)} />
        <Fact label="Travel time" value={deal.travelTime} />
        <Fact label="Fare" value={joinFare(deal)} />
        <Fact label="Season" value={seasonalityText(deal.seasonality)} />
      </dl>

      {deal.whyGood && (
        <p className="mt-4 text-sm leading-7 text-foam/80">{deal.whyGood}</p>
      )}

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {warnings.map(warning => (
            <li
              key={warning}
              className="flex items-start gap-2 text-sm text-danger"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}

      {deal.event?.name && <EventBlock event={deal.event} />}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {deal.bookingUrl && (
          <a
            href={deal.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-medium text-on-gold"
          >
            Open fare
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {deal.sourceUrl && (
          <a
            href={deal.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-mute underline decoration-line underline-offset-4 hover:text-foam"
          >
            Seen on {hostLabel(deal.sourceUrl)}
          </a>
        )}
      </div>
    </article>
  )
}

function EventBlock({ event }: { event: NonNullable<FareDeal['event']> }) {
  const dates = dateRange(event.startDate, event.endDate)
  return (
    <div className="mt-4 rounded-xl border border-teal/30 bg-teal/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Ticket className="h-4 w-4 text-teal" />
        <p className="font-medium text-foam">{event.name}</p>
        {event.city && <span className="text-sm text-mute">{event.city}</span>}
      </div>
      {dates !== 'Dates to confirm' && (
        <p className="mt-2 text-sm text-teal">{dates}</p>
      )}
      {event.notes && (
        <p className="mt-2 text-sm leading-6 text-foam/80">{event.notes}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {event.separateTicket && (
          <span className="text-mute">Separate ticket required</span>
        )}
        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-gold underline decoration-gold/40 underline-offset-4"
          >
            {hostLabel(event.sourceUrl)}
          </a>
        )}
      </div>
    </div>
  )
}

function AlsoChecked({ items }: { items: Array<Partial<CheckedFare>> }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.18em] text-mute">
        Also checked
      </h3>
      <ul className="mt-3 divide-y divide-line/60 rounded-2xl border border-line/60">
        {items.map((item, index) => (
          <li
            key={`${item.route}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="text-foam/90">{item.route}</span>
            <span className="flex flex-wrap items-center gap-3 text-mute">
              {item.note && <span>{item.note}</span>}
              {formatUsd(item.priceUsd) && (
                <span className="text-foam/80">{formatUsd(item.priceUsd)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Notes({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'foam' | 'mute'
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.18em] text-mute">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map(item => (
          <li
            key={item}
            className={cn(
              'flex gap-3 text-sm leading-6',
              tone === 'foam' ? 'text-foam/85' : 'text-mute',
            )}
          >
            <span className="text-gold">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-mute">{label}</dt>
      <dd className="mt-1 text-foam/90">{value}</dd>
    </div>
  )
}

function RawReport({ text, running }: { text: string; running?: boolean }) {
  const trimmed = text.trim()
  if (!trimmed || (running && trimmed.startsWith('{'))) {
    return (
      <p className="text-sm leading-7 text-mute">
        Querying Skyscanner, airline pages, and event calendars...
      </p>
    )
  }
  return (
    <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foam/90">
      {linkify(text)}
    </pre>
  )
}

function linkify(text: string) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s)]+)/g)
  return parts.map((part, index) => {
    if (/^(https?:\/\/|www\.)/.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-gold underline decoration-gold/40 underline-offset-2"
        >
          {part}
        </a>
      )
    }
    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function formatUsd(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const parsed = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function dateRange(from?: string | null, to?: string | null) {
  const start = formatDate(from)
  const end = formatDate(to)
  if (start && end) return `${start} — ${end}`
  return start || end || 'Dates to confirm'
}

function joinList(values?: string[]) {
  return (values ?? []).join(', ')
}

function routing(deal: Partial<FareDeal>) {
  const parts: string[] = []
  if (deal.stops === 0) parts.push('Nonstop')
  if (typeof deal.stops === 'number' && deal.stops > 0) {
    parts.push(`${deal.stops} stop${deal.stops > 1 ? 's' : ''}`)
  }
  const connections = joinList(deal.connections)
  if (connections) parts.push(`via ${connections}`)
  return parts.join(' ')
}

function joinFare(deal: Partial<FareDeal>) {
  return [deal.fareBrand, deal.baggage].filter(Boolean).join(' · ')
}

function seasonalityText(value?: string | null) {
  if (value === 'year_round') return 'Year-round destination'
  if (value === 'seasonal') return 'Seasonal destination'
  return ''
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'source'
  }
}
