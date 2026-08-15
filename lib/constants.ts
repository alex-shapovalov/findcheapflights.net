export const FREE_SEARCH_LIMIT = 1
export const FREE_IP_DAILY_LIMIT = 1
export const SUBSCRIBER_DAILY_LIMIT = 25
export const BURST_WINDOW_SECONDS = 60
export const SEARCH_IP_BURST_LIMIT = 6
export const SEARCH_USER_BURST_LIMIT = 4
export const QUOTA_IP_BURST_LIMIT = 60
export const NEARBY_RADIUS_KM = 560
export const SEARCH_HORIZON_MONTHS = 24
export const APP_NAME =
  'findcheapflights.ai | Find Cheap Flights anywhere in the world'
export const SITE_URL = 'https://findcheapflights.ai'
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === 'production' ? SITE_URL : 'http://localhost:3000')
export const isCanonicalSite = process.env.NEXT_PUBLIC_APP_URL === SITE_URL
export const OPENROUTER_MODEL = 'google/gemini-3.7-flash'
export const CONTACT_EMAIL = 'support@findcheapflights.ai'

export const PLANS = {
  monthly: {
    name: 'Pro Monthly',
    amountUsd: 11.99,
    interval: 'month' as const,
    searchesPerDay: SUBSCRIBER_DAILY_LIMIT,
  },
  yearly: {
    name: 'Pro Yearly',
    amountUsd: 119.99,
    interval: 'year' as const,
    searchesPerDay: SUBSCRIBER_DAILY_LIMIT,
  },
} as const

export const CONTINENTS = [
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Africa',
  'Oceania',
] as const

export type Continent = (typeof CONTINENTS)[number]

export const TRAVEL_THEMES = [
  { id: 'electronic', label: 'Electronic & clubs' },
  { id: 'concerts', label: 'Concerts & live music' },
  { id: 'nightlife', label: 'Nightlife & bars' },
  { id: 'cities', label: 'Cities, art & museums' },
  { id: 'food', label: 'Food & wine' },
  { id: 'beaches', label: 'Beaches & islands' },
  { id: 'diving', label: 'Diving & snorkeling' },
  { id: 'surf', label: 'Surf' },
  { id: 'ski', label: 'Ski & snowboard' },
  { id: 'hiking', label: 'Hiking & national parks' },
  { id: 'sport', label: 'Live sport' },
  { id: 'markets', label: 'Christmas markets' },
  { id: 'wellness', label: 'Spas & wellness' },
] as const

export type TravelThemeId = (typeof TRAVEL_THEMES)[number]['id']

export function isTravelThemeId(value: unknown): value is TravelThemeId {
  return TRAVEL_THEMES.some(theme => theme.id === value)
}

export function travelThemeLabel(value: string | undefined) {
  return TRAVEL_THEMES.find(theme => theme.id === value)?.label
}
