export const FREE_SEARCH_LIMIT = 1
export const GUEST_IP_DAILY_LIMIT = 1
export const SUBSCRIBER_DAILY_LIMIT = 25
export const NEARBY_RADIUS_KM = 560
export const SEARCH_HORIZON_MONTHS = 24
export const APP_NAME = 'Find Cheap Flights'
export const SITE_URL = 'https://findcheapflights.net'
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === 'production' ? SITE_URL : 'http://localhost:3000')
export const OPENROUTER_MODEL = 'google/gemini-3.5-flash-lite'

export const SIGN_IN_PATH = '/sign-in'
export const SIGN_UP_PATH = '/sign-up'
export const AFTER_AUTH_PATH = '/'

export const PLANS = {
  monthly: {
    name: 'Pro Monthly',
    amountUsd: 5,
    interval: 'month' as const,
    searchesPerDay: SUBSCRIBER_DAILY_LIMIT,
  },
  yearly: {
    name: 'Pro Yearly',
    amountUsd: 50,
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
