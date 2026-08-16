import {
  CONTINENTS,
  isTravelThemeId,
  NEARBY_DRIVE_HOURS_DEFAULT,
  NEARBY_DRIVE_HOURS_MAX,
  NEARBY_DRIVE_HOURS_MIN,
  SEARCH_HORIZON_MONTHS,
} from './constants'
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

  const result: SearchRequest = {
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
    driveHours: parseDriveHours(input.driveHours),
    interests: isTravelThemeId(input.interests) ? input.interests : undefined,
  }

  assertSensibleDates(result.dateFrom, result.dateTo)
  return result
}

function uniqueIatas(value: unknown) {
  if (!Array.isArray(value)) return []
  const codes = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().toUpperCase())
    .filter(item => IATA.test(item))
  return [...new Set(codes)].slice(0, 12)
}

function parseDriveHours(value: unknown) {
  if (value == null || value === '') return NEARBY_DRIVE_HOURS_DEFAULT
  const parsed = typeof value === 'number' ? value : Number(value)
  if (
    !Number.isInteger(parsed) ||
    parsed < NEARBY_DRIVE_HOURS_MIN ||
    parsed > NEARBY_DRIVE_HOURS_MAX
  ) {
    throw new Error(
      `Drive hours must be between ${NEARBY_DRIVE_HOURS_MIN} and ${NEARBY_DRIVE_HOURS_MAX}`,
    )
  }
  return parsed
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
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ${label}`)
  }
  return value
}

function utcToday() {
  return new Date().toISOString().slice(0, 10)
}

function shiftUtcDate(iso: string, months: number, days = 0) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

function assertSensibleDates(dateFrom?: string, dateTo?: string) {
  const earliest = shiftUtcDate(utcToday(), 0, -1)
  const latest = shiftUtcDate(utcToday(), SEARCH_HORIZON_MONTHS)
  if (dateFrom && dateFrom < earliest) {
    throw new Error('Search from cannot be in the past')
  }
  if (dateTo && dateTo < earliest) {
    throw new Error('Search until cannot be in the past')
  }
  if (dateFrom && dateFrom > latest) {
    throw new Error('Search from is too far in the future')
  }
  if (dateTo && dateTo > latest) {
    throw new Error('Search until is too far in the future')
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new Error('Search from must be on or before search until')
  }
}
