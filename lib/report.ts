import { getAirport, searchAirports } from './airports'
import {
  itinerarySearchUrl,
  safeBookingUrl,
  safeExternalUrl,
  safeFareUrl,
} from './link-guard'
import type { TripType } from './types'

export const DEAL_RATINGS = [
  'INTERESTING',
  'GOOD',
  'VERY_GOOD',
  'EXCELLENT',
  'EXCEPTIONAL',
  'EXTREME',
] as const

export const DEAL_LABELS = [
  'CHEAPEST_OVERALL',
  'BEST_VALUE',
  'EVENT_JACKPOT',
] as const

export type DealRating = (typeof DEAL_RATINGS)[number]
export type DealLabel = (typeof DEAL_LABELS)[number]
export type Seasonality = 'year_round' | 'seasonal'
export type ReportVerdict = 'deals_found' | 'nothing_compelling'

export type DealEvent = {
  name: string
  city: string | null
  startDate: string | null
  endDate: string | null
  sourceUrl: string | null
  separateTicket: boolean | null
  notes: string | null
}

export type FareDeal = {
  destinationCity: string
  destinationAirport: string
  originAirport: string
  seasonality: Seasonality | null
  tripType: TripType
  priceUsd: number
  priceOriginal: string | null
  aboveRequestedCap: boolean | null
  departDate: string
  returnDate: string | null
  nights: number | null
  airlines: string[]
  stops: number | null
  connections: string[]
  travelTime: string | null
  fareBrand: string | null
  baggage: string | null
  warnings: string[]
  rating: DealRating
  labels: DealLabel[]
  whyGood: string
  bookingUrl: string | null
  sourceUrl: string | null
  verifiedLive: boolean | null
  event: DealEvent | null
}

export type CheckedFare = {
  route: string
  priceUsd: number | null
  note: string | null
}

export type FareReport = {
  headline: string
  verdict: ReportVerdict
  summary: string
  deals: FareDeal[]
  alsoChecked: CheckedFare[]
  recommendations: string[]
  limitations: string[]
}

export type PartialFareReport = {
  headline?: string
  verdict?: ReportVerdict
  summary?: string
  deals?: Array<Partial<FareDeal>>
  alsoChecked?: Array<Partial<CheckedFare>>
  recommendations?: string[]
  limitations?: string[]
}

export function parseFareReport(text: string): PartialFareReport | null {
  const start = text.indexOf('{')
  if (start < 0) return null
  const source = text.slice(start)
  for (const candidate of repairCandidates(source)) {
    const parsed = tryParse(candidate)
    if (parsed) return normalizeReport(parsed)
  }
  return null
}

export function hasReportContent(report: PartialFareReport) {
  return Boolean(report.headline || report.summary || report.deals?.length)
}

function* repairCandidates(source: string) {
  yield source
  yield closeJson(source)
  const lastBrace = source.lastIndexOf('}')
  if (lastBrace > 0) yield source.slice(0, lastBrace + 1)
  const lastComma = source.lastIndexOf(',')
  if (lastComma > 0) yield closeJson(source.slice(0, lastComma))
}

function tryParse(candidate: string): Record<string, unknown> | null {
  if (!candidate.trim()) return null
  try {
    const parsed: unknown = JSON.parse(candidate)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeReport(raw: Record<string, unknown>): PartialFareReport {
  const alsoChecked = asRecordList(raw.alsoChecked, 'route').map(item => ({
    route: asText(item.route),
    priceUsd: asNumber(item.priceUsd) ?? priceFromText(item.route),
    note: asText(item.note),
  }))
  let deals = asRecordList(raw.deals).map(normalizeDeal)
  if (deals.length === 0) {
    deals = alsoChecked
      .map(item => {
        const pair = asRoutePair(item.route)
        return normalizeDeal({
          originAirport: pair.origin,
          destinationAirport: pair.destination,
          priceUsd: item.priceUsd,
          whyGood: item.note ?? item.route,
          aboveRequestedCap: true,
          warnings: [
            'Pulled from coverage notes — confirm this fare is still bookable.',
          ],
        })
      })
      .filter(deal => deal.priceUsd != null)
      .slice(0, 8)
  }
  const hasUnderCap = deals.some(deal => deal.aboveRequestedCap !== true)
  return {
    headline: asText(raw.headline),
    verdict:
      asEnum(raw.verdict, ['deals_found', 'nothing_compelling'] as const) ??
      (hasUnderCap ? 'deals_found' : 'nothing_compelling'),
    summary: asText(raw.summary),
    deals,
    alsoChecked,
    recommendations: asTextList(raw.recommendations),
    limitations: asTextList(raw.limitations),
  }
}

function normalizeDeal(raw: Record<string, unknown>): Partial<FareDeal> {
  const route = asRoutePair(
    raw.route ?? raw.itinerary ?? raw.path ?? raw.routing,
  )
  const linked = iatasFromUrl(
    asText(raw.bookingUrl) ?? asText(raw.sourceUrl) ?? asText(raw.url),
  )
  const originAirport =
    firstIata(raw, [
      'originAirport',
      'origin',
      'from',
      'originIata',
      'originCode',
      'departureAirport',
      'origin_airport',
      'fromAirport',
    ]) ??
    route.origin ??
    linked.origin
  const destinationAirport =
    firstIata(raw, [
      'destinationAirport',
      'destination',
      'to',
      'destinationIata',
      'destinationCode',
      'arrivalAirport',
      'destination_airport',
      'toAirport',
    ]) ??
    route.destination ??
    linked.destination ??
    iataFromCity(raw.destinationCity ?? raw.city)
  const destinationCity =
    asText(raw.destinationCity) ??
    asText(raw.city) ??
    (destinationAirport ? getAirport(destinationAirport)?.city : undefined)
  const departDate = asText(raw.departDate)
  const returnDate = asText(raw.returnDate)
  const airlines = asTextList(raw.airlines)
  const stops = asNumber(raw.stops)
  const requestedBooking = asText(raw.bookingUrl) ?? asText(raw.url)
  const keptBooking = safeBookingUrl(requestedBooking)
  const bookingUrl =
    keptBooking ??
    itinerarySearchUrl({
      originAirport,
      destinationAirport,
      departDate,
      returnDate,
      airlines,
      stops,
    })
  const sourceUrl =
    safeFareUrl(asText(raw.sourceUrl)) ??
    (keptBooking ? undefined : safeFareUrl(requestedBooking))

  return {
    destinationCity,
    destinationAirport,
    originAirport,
    seasonality: asEnum(raw.seasonality, ['year_round', 'seasonal'] as const),
    tripType: asEnum(raw.tripType, ['round_trip', 'one_way'] as const),
    priceUsd: asNumber(raw.priceUsd),
    priceOriginal: asText(raw.priceOriginal),
    aboveRequestedCap: asBoolean(raw.aboveRequestedCap),
    departDate,
    returnDate,
    nights: asNumber(raw.nights),
    airlines,
    stops,
    connections: asTextList(raw.connections),
    travelTime: asText(raw.travelTime),
    fareBrand: asText(raw.fareBrand),
    baggage: asText(raw.baggage),
    warnings: asTextList(raw.warnings),
    rating: asEnum(raw.rating, DEAL_RATINGS),
    labels: asTextList(raw.labels)
      .map(label => asEnum(label, DEAL_LABELS))
      .filter((label): label is DealLabel => Boolean(label)),
    whyGood: asText(raw.whyGood),
    bookingUrl,
    sourceUrl,
    verifiedLive: bookingUrl ? asBoolean(raw.verifiedLive) : false,
    event: normalizeEvent(raw.event),
  }
}

function normalizeEvent(raw: unknown): DealEvent | undefined {
  const name = isRecord(raw) ? asText(raw.name) : asText(raw)
  if (!name) return undefined
  const event = isRecord(raw) ? raw : {}
  return {
    name,
    city: asText(event.city) ?? null,
    startDate: asText(event.startDate) ?? null,
    endDate: asText(event.endDate) ?? null,
    sourceUrl: asUrl(event.sourceUrl) ?? null,
    separateTicket: asBoolean(event.separateTicket) ?? null,
    notes: asText(event.notes) ?? null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function asNumber(value: unknown) {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function priceFromText(value: unknown) {
  const text = asText(value)
  if (!text) return undefined
  const match = text.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/)
  if (!match) return undefined
  return Number(match[1].replace(/,/g, ''))
}

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function asUrl(value: unknown) {
  return safeExternalUrl(asText(value))
}

function asTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(asText).filter((item): item is string => Boolean(item))
  }
  const single = asText(value)
  return single ? [single] : []
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[]) {
  const text = asText(value)
  if (!text) return undefined
  const key = canonical(text)
  return allowed.find(option => canonical(option) === key)
}

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function asRecordList(value: unknown, textKey?: string) {
  const items = Array.isArray(value) ? value : [value]
  return items.flatMap(item => {
    if (isRecord(item)) return [item]
    const text = textKey ? asText(item) : undefined
    return text ? [{ [textKey as string]: text }] : []
  })
}

function firstIata(raw: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const code = asIata(raw[key], true)
    if (code) return code
  }
  return undefined
}

function asIata(value: unknown, dedicatedField = false): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const code = asIata(item, dedicatedField)
      if (code) return code
    }
    return undefined
  }
  if (isRecord(value)) {
    return (
      asIata(value.iata, true) ??
      asIata(value.code, true) ??
      asIata(value.airportCode, true) ??
      asIata(value.airport, dedicatedField) ??
      iataFromCity(value.city)
    )
  }
  const text = asText(value)
  if (!text) return undefined
  const upper = text.toUpperCase()
  if (/^[A-Z]{3}$/.test(upper)) {
    return dedicatedField || getAirport(upper) ? upper : undefined
  }
  const paren = text.match(/\(([A-Za-z]{3})\)/)
  if (paren) {
    const code = paren[1].toUpperCase()
    if (dedicatedField || getAirport(code)) return code
  }
  const leading = text.match(/^([A-Za-z]{3})\b/)
  if (leading) {
    const code = leading[1].toUpperCase()
    if (getAirport(code)) return code
  }
  return iataFromCity(text)
}

function iataFromCity(value: unknown) {
  const text = asText(value)
  if (!text) return undefined
  const needle = text.toLowerCase()
  const exact = searchAirports(text, 5).find(
    airport =>
      airport.city.toLowerCase() === needle ||
      airport.iata.toLowerCase() === needle,
  )
  return exact?.iata
}

function asRoutePair(value: unknown) {
  const text = asText(value)
  if (!text) return {}
  const parts = text.split(/\s*(?:→|->|—|–|\/|\bto\b)\s*/i)
  if (parts.length >= 2) {
    return {
      origin: asIata(parts[0], true),
      destination: asIata(parts[parts.length - 1], true),
    }
  }
  const codes = [...text.matchAll(/\b([A-Za-z]{3})\b/g)]
    .map(match => match[1].toUpperCase())
    .filter(code => getAirport(code))
  if (codes.length >= 2) {
    return { origin: codes[0], destination: codes[codes.length - 1] }
  }
  return {}
}

function iatasFromUrl(url?: string) {
  if (!url) return {}
  const fromTo = url.match(/from[:/=]([A-Za-z]{3}).*?to[:/=]([A-Za-z]{3})/i)
  if (fromTo) {
    return {
      origin: fromTo[1].toUpperCase(),
      destination: fromTo[2].toUpperCase(),
    }
  }
  try {
    const parsed = new URL(url)
    const params = parsed.searchParams
    const origin =
      asIata(
        params.get('origin') ??
          params.get('from') ??
          params.get('o1') ??
          params.get('originAirport') ??
          params.get('orig'),
        true,
      ) ?? undefined
    const destination =
      asIata(
        params.get('destination') ??
          params.get('to') ??
          params.get('d1') ??
          params.get('destinationAirport') ??
          params.get('dest'),
        true,
      ) ?? undefined
    if (origin || destination) return { origin, destination }
    const pathCodes = [...parsed.pathname.matchAll(/\/([A-Za-z]{3})(?=\/|$)/g)]
      .map(match => match[1].toUpperCase())
      .filter(code => getAirport(code))
    if (pathCodes.length >= 2) {
      return {
        origin: pathCodes[0],
        destination: pathCodes[pathCodes.length - 1],
      }
    }
  } catch {
    return {}
  }
  return {}
}

function closeJson(text: string) {
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (const char of text) {
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') stack.push(char)
    if (char === '}' || char === ']') stack.pop()
  }

  let out = trimDanglingTail(inString ? `${text}"` : text)
  while (stack.length > 0) {
    out += stack.pop() === '{' ? '}' : ']'
  }
  return out
}

function trimDanglingTail(text: string) {
  let out = text.trimEnd()
  while (out.length > 0 && /[,:+\-.eE]$/.test(out.slice(-1))) {
    out = out.slice(0, -1).trimEnd()
  }
  return out
}
