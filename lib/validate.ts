import { CONTINENTS, isTravelThemeId } from './constants'
import type { SearchMode, SearchRequest, TripType } from './types'

const IATA = /^[A-Z]{3}$/

export function parseSearchRequest(body: unknown): SearchRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid search payload')
  }
  const input = body as Record<string, unknown>
  const mode = input.mode
  const tripType = input.tripType
  if (mode !== 'flexible_destination' && mode !== 'flexible_origin') {
    throw new Error('Choose flexible destination or flexible origin')
  }
  if (tripType !== 'round_trip' && tripType !== 'one_way') {
    throw new Error('Choose round trip or one way')
  }

  const originAirports = uniqueIatas(input.originAirports)
  const destinationAirports = uniqueIatas(input.destinationAirports)

  if (originAirports.length === 0) {
    throw new Error('Select at least one origin airport')
  }

  if (mode === 'flexible_destination') {
    if (
      typeof input.continent !== 'string' ||
      !CONTINENTS.includes(input.continent as never)
    ) {
      throw new Error('Select a destination continent')
    }
  } else if (destinationAirports.length === 0) {
    throw new Error('Select at least one destination airport')
  }

  return {
    mode: mode as SearchMode,
    tripType: tripType as TripType,
    originAirports,
    destinationAirports,
    continent:
      mode === 'flexible_destination'
        ? (input.continent as SearchRequest['continent'])
        : undefined,
    minPrice: optionalNumber(input.minPrice, 'min price'),
    maxPrice: optionalNumber(input.maxPrice, 'max price'),
    dateFrom: optionalDate(input.dateFrom, 'start date'),
    dateTo: optionalDate(input.dateTo, 'end date'),
    minNights: optionalNumber(input.minNights, 'min nights'),
    maxNights: optionalNumber(input.maxNights, 'max nights'),
    interests: isTravelThemeId(input.interests) ? input.interests : undefined,
  }
}

function uniqueIatas(value: unknown) {
  if (!Array.isArray(value)) return []
  const codes = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().toUpperCase())
    .filter(item => IATA.test(item))
  return [...new Set(codes)].slice(0, 12)
}

function optionalNumber(value: unknown, label: string) {
  if (value == null || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label}`)
  }
  return parsed
}

function optionalDate(value: unknown, label: string) {
  if (value == null || value === '') return undefined
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
  return value
}
