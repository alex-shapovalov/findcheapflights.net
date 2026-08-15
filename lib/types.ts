import type { Continent, TravelThemeId } from './constants'

export type SearchMode = 'flexible_destination' | 'flexible_origin'
export type TripType = 'round_trip' | 'one_way'

export type SearchRequest = {
  mode: SearchMode
  tripType: TripType
  originAirports: string[]
  destinationAirports: string[]
  continent?: Continent
  minPrice?: number
  maxPrice?: number
  dateFrom?: string
  dateTo?: string
  minNights?: number
  maxNights?: number
  interests?: TravelThemeId
}

export type QuotaState = {
  subscribed: boolean
  lifetimeUsed: number
  monthlyUsed: number
  monthlyLimit: number
  remaining: number
  paywalled: boolean
}
