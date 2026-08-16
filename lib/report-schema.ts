import { DEAL_LABELS, DEAL_RATINGS } from './report'

const stringOrNull = { type: ['string', 'null'] } as const
const numberOrNull = { type: ['number', 'null'] } as const
const booleanOrNull = { type: ['boolean', 'null'] } as const
const stringArray = { type: 'array', items: { type: 'string' } } as const

const eventSchema = {
  type: ['object', 'null'],
  additionalProperties: false,
  required: [
    'name',
    'city',
    'startDate',
    'endDate',
    'sourceUrl',
    'separateTicket',
    'notes',
  ],
  properties: {
    name: { type: 'string' },
    city: stringOrNull,
    startDate: {
      ...stringOrNull,
      description: 'Event start date as YYYY-MM-DD.',
    },
    endDate: { ...stringOrNull, description: 'Event end date as YYYY-MM-DD.' },
    sourceUrl: {
      ...stringOrNull,
      description: 'Official or reliable source that confirms the dates.',
    },
    separateTicket: booleanOrNull,
    notes: stringOrNull,
  },
} as const

const dealSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'destinationCity',
    'destinationAirport',
    'originAirport',
    'seasonality',
    'tripType',
    'priceUsd',
    'priceOriginal',
    'aboveRequestedCap',
    'departDate',
    'returnDate',
    'nights',
    'airlines',
    'stops',
    'connections',
    'travelTime',
    'fareBrand',
    'baggage',
    'warnings',
    'rating',
    'labels',
    'whyGood',
    'bookingUrl',
    'sourceUrl',
    'verifiedLive',
    'event',
  ],
  properties: {
    destinationCity: {
      type: 'string',
      description: 'Destination city name only, for example Reykjavik.',
    },
    destinationAirport: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      pattern: '^[A-Z]{3}$',
      description:
        'Three-letter IATA code of the arrival airport, uppercase, for example KEF. Never a city name.',
    },
    originAirport: {
      type: 'string',
      minLength: 3,
      maxLength: 3,
      pattern: '^[A-Z]{3}$',
      description:
        'Three-letter IATA code of the departure airport, uppercase, for example TPA. Never a city name.',
    },
    seasonality: {
      type: ['string', 'null'],
      enum: ['year_round', 'seasonal', null],
    },
    tripType: { type: 'string', enum: ['round_trip', 'one_way'] },
    priceUsd: {
      type: 'number',
      description:
        'Total price per traveler in USD for the whole itinerary, not per leg.',
    },
    priceOriginal: {
      ...stringOrNull,
      description:
        'Original amount and currency when it was not priced in USD.',
    },
    aboveRequestedCap: {
      ...booleanOrNull,
      description: 'True when the fare exceeds the price cap the traveler set.',
    },
    departDate: { type: 'string', description: 'Outbound date as YYYY-MM-DD.' },
    returnDate: {
      ...stringOrNull,
      description: 'Return date as YYYY-MM-DD, or null for one-way.',
    },
    nights: numberOrNull,
    airlines: stringArray,
    stops: { ...numberOrNull, description: 'Stops on the longest direction.' },
    connections: {
      ...stringArray,
      description: 'Connection airport codes when known.',
    },
    travelTime: stringOrNull,
    fareBrand: {
      ...stringOrNull,
      description: 'Fare brand, for example basic economy.',
    },
    baggage: stringOrNull,
    warnings: {
      ...stringArray,
      description:
        'Self-transfers, separate tickets, airport changes, overnight layovers, risky connections, stale pricing.',
    },
    rating: { type: 'string', enum: [...DEAL_RATINGS] },
    labels: {
      type: 'array',
      items: { type: 'string', enum: [...DEAL_LABELS] },
    },
    whyGood: {
      type: 'string',
      description: 'Why this fare is unusually good, in plain sentences.',
    },
    bookingUrl: {
      ...stringOrNull,
      description:
        'Required Google Flights href for this itinerary. Prefer a copied /travel/flights/booking?tfs=&tfu= link. Otherwise a dated Google Flights search. Must be fetched in this run and must have shown this origin, destination, dates, and price. Never a marketing page.',
    },
    sourceUrl: {
      type: 'string',
      description:
        'Required. Page where you first saw this fare, or the same Google Flights href. Never a marketing or continent browse page.',
    },
    verifiedLive: {
      ...booleanOrNull,
      description:
        'True only after the Google Flights bookingUrl was fetched in this run and that page showed this origin, destination, dates, and the same priceUsd. False if you only constructed the URL or the price came from another site.',
    },
    event: eventSchema,
  },
} as const

export const FARE_REPORT_SCHEMA = {
  name: 'fare_report',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['headline', 'verdict', 'summary', 'deals', 'alsoChecked'],
    properties: {
      headline: {
        type: 'string',
        description:
          'One-line verdict naming a fare, at most 90 characters. Never say that nothing was found.',
      },
      verdict: {
        type: 'string',
        enum: ['deals_found', 'nothing_compelling'],
        description:
          'deals_found if any deal meets the cap. nothing_compelling if every deal is above the cap. deals must still be populated in both cases.',
      },
      summary: {
        type: 'string',
        description: 'Two to five plain sentences of honest context.',
      },
      deals: {
        type: 'array',
        minItems: 1,
        maxItems: 8,
        description:
          'Currently bookable fares, cheapest first. Never empty. If nothing meets the price cap, include the closest live fares and set aboveRequestedCap.',
        items: dealSchema,
      },
      alsoChecked: {
        type: 'array',
        description:
          'Expired recaps, stale pages, and routes that were not close enough to list as deals. Every item must include a clickable sourceUrl.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['route', 'priceUsd', 'note', 'sourceUrl'],
          properties: {
            route: {
              type: 'string',
              description: 'For example TPA to BCN.',
            },
            priceUsd: numberOrNull,
            note: stringOrNull,
            sourceUrl: {
              type: 'string',
              description:
                'Required. The recap, stale page, or dated Google/Kayak/Skyscanner search you opened for this route. Never null. Never a marketing page.',
            },
          },
        },
      },
    },
  },
} as const
