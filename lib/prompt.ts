import {
  describeAirports,
  formatAirport,
  getAirport,
  nearbyAirports,
} from './airports'
import type { SearchRequest } from './types'

function priceLine(minPrice?: number, maxPrice?: number) {
  if (minPrice != null && maxPrice != null) {
    return `Only consider fares between $${minPrice} and $${maxPrice} USD. Treat amounts above $${maxPrice} as out of scope unless an unusually compelling event/date combination exists just above the cap, and say so explicitly.`
  }
  if (maxPrice != null) {
    return `Maximum price: $${maxPrice} USD. Generally do not alert above this cap. A fare slightly above $${maxPrice} can qualify only if it is unusually low historically, exceptionally convenient, or aligned with a major event that makes the overall trip compelling.`
  }
  if (minPrice != null) {
    return `Ignore junk/impossible fares below $${minPrice} USD unless you can verify they are real, bookable, and not a mistake/scrape error.`
  }
  return 'Use destination-aware deal thresholds. For transatlantic leisure trips, mainland/major European cities are generally interesting at <=$400, strongly prioritized at <=$350, exceptional at <=$300. Beach/island seasonal destinations may justify a higher bar. Adjust judgment for destination, season, historical norms, itinerary quality, and any event value.'
}

function dateLine(input: SearchRequest) {
  const parts: string[] = []
  if (input.dateFrom && input.dateTo) {
    parts.push(`Search travel from ${input.dateFrom} through ${input.dateTo}.`)
  } else if (input.dateFrom) {
    parts.push(
      `Search from ${input.dateFrom} through the maximum meaningful booking horizon.`,
    )
  } else if (input.dateTo) {
    parts.push(`Search from now through ${input.dateTo}.`)
  } else {
    parts.push(
      'Search from the present through the maximum meaningful booking horizon. For future years, search as far into the future as meaningful bookable inventory is available.',
    )
  }
  if (input.tripType === 'round_trip') {
    const minNights = input.minNights ?? 3
    const maxNights = input.maxNights ?? 10
    parts.push(
      `Preferred trip length is ${minNights}–${maxNights} nights, but inspect/report unusually cheap trips outside that range.`,
    )
  }
  return parts.join(' ')
}

function originBlock(input: SearchRequest) {
  const listed = describeAirports(input.originAirports)
  const extras = nearbyAirports(input.originAirports)
    .slice(0, 12)
    .map(airport => airport.iata)
  const convenience = input.originAirports
    .map(code => getAirport(code))
    .filter(Boolean)
    .slice(0, 1)
    .map(airport => airport && formatAirport(airport))[0]

  if (input.mode === 'flexible_origin') {
    return [
      `HOME / ORIGIN CONTEXT: The traveler is based near ${listed || 'an unspecified area'}. Departure airports are VARIABLE.`,
      extras.length
        ? `Also consider these nearby/alternate origins when they materially reduce airfare: ${extras.join(', ')}.`
        : 'Search practical alternate origin airports serving the same region when they materially reduce airfare.',
      convenience
        ? `${convenience} is the convenience baseline, but search ALL plausible origins independently and do not stop after finding one deal.`
        : 'Search all plausible origins independently and do not stop after finding one deal.',
      'Compare fare savings against extra positioning/drive time; a modest savings from a farther origin is less compelling than the same fare from the closest convenient airport, while a huge savings or special event can justify positioning.',
      'Normalize non-USD fares to USD while also reporting the original currency.',
    ].join(' ')
  }

  return [
    `Origins: ${listed}.`,
    extras.length
      ? `Airports within roughly a 6-hour drive that may also be worth a look if the user-selected set is sparse: ${extras.join(', ')}. Prefer the user-selected origins; only use extras when they produce a clearly better deal.`
      : 'Search the listed origins independently.',
    convenience
      ? `${convenience.split(' (')[0]} is the convenience baseline if it is in the origin set, but search ALL listed origins independently and do not stop after finding one deal.`
      : 'Search ALL listed origins independently and do not stop after finding one deal.',
    'Compare fare savings against the extra drive to a farther origin. Normalize non-USD fares to USD while also reporting the original currency.',
  ].join(' ')
}

function destinationBlock(input: SearchRequest) {
  if (input.mode === 'flexible_origin') {
    const dest = describeAirports(input.destinationAirports)
    return [
      `PRIMARY DESTINATION: ${dest}. This destination is locked; do not substitute a different city unless you also report the requested destination.`,
      'Consider practical alternate airports serving the same destination/region when they materially reduce airfare, and label the airport used.',
      'Apply destination-aware seasonality instead of one universal date rule. Major cultural/city destinations should generally be treated as year-round even if summer is popular. Strongly beach-oriented or island destinations should be searched primarily when meaningfully in season, while allowing shoulder season when worthwhile. Ski/winter destinations should be searched primarily during winter.',
    ].join(' ')
  }

  const continent = input.continent ?? 'the selected continent'
  return [
    `PRIMARY OBJECTIVE: Find exceptional spontaneous ${input.tripType === 'one_way' ? 'one-way' : 'round-trip'} deals from the origin set to attractive destinations in ${continent}. The destination is VARIABLE.`,
    `Search ${continent} broadly. Do not lock onto a single city. Cover a mix of major city destinations and seasonal leisure destinations, then drill into the most promising fares.`,
    'Apply destination-aware seasonality instead of one universal date rule.',
    'YEAR-ROUND CITY DESTINATIONS: Search throughout the entire year and as far forward as meaningful bookable inventory permits. Do not suppress an exceptional winter or late-fall deal merely because it is outside summer.',
    'SEASONAL LEISURE DESTINATIONS: Restrict searches primarily to periods when the destination is meaningfully in season, while allowing shoulder season when worthwhile. Use reasonable travel judgment for destinations not explicitly listed. Major cultural/city destinations should generally be treated as year-round even if summer is popular.',
  ].join(' ')
}

function interestsBlock(interests?: string) {
  const text = interests?.trim()
  if (!text) {
    return 'TRAVEL PREFERENCE: No special theme was provided. Optimize for genuinely cheap, high-quality itineraries to compelling destinations. Do not invent a hobby theme.'
  }
  return [
    `TRAVEL PREFERENCE / DESTINATION VALUE: The traveler cares about: ${text}.`,
    'This should materially influence which destinations and dates are considered compelling. A cheap fare becomes substantially more valuable when it overlaps with a relevant event, festival, season, or city that matches this preference.',
    'Search public current event/festival information when useful to evaluate a fare. Do not require an event for a fare to qualify, but actively look for airfare + event combinations that create unusually compelling spontaneous trips.',
    'If an exceptional airfare lines up with a relevant major event, alert even when the airfare alone is only moderately discounted, provided the overall opportunity is unusually compelling. Clearly state that the event itself may require a separate ticket and verify dates from current sources before using an event as part of the recommendation.',
    'Prioritize genuinely prominent or unusually appealing events rather than every local listing.',
  ].join(' ')
}

export function buildFlightHuntPrompt(input: SearchRequest, today: string) {
  const tripLabel = input.tripType === 'one_way' ? 'one-way' : 'round-trip'
  const cabin = 'economy'

  return `Act as an aggressive flexible-date airfare deal hunter for spontaneous leisure trips. Search current ${tripLabel} ${cabin} fares using live/publicly accessible flight-search and airline information whenever possible. Today is ${today}.

${originBlock(input)}

${interestsBlock(input.interests)}

${destinationBlock(input)}

${dateLine(input)}

TRIP TYPE: ${tripLabel === 'one-way' ? 'One-way only. Do not report round-trip bundles as if they were one-way fares.' : 'Round-trip. Report total round-trip price, exact outbound and return dates, and trip length in nights.'}

DEAL THRESHOLDS: ${priceLine(input.minPrice, input.maxPrice)}

ITINERARY QUALITY: Economy/basic economy is acceptable but label basic economy and meaningful baggage restrictions. Prefer nonstop or one-stop protected itineraries. Two stops are acceptable only for substantial savings. Clearly flag self-transfers, separate tickets, airport changes, overnight layovers, or risky connections. Do not recommend an absurd itinerary to save a trivial amount.

SEARCH STRATEGY: On each run, maximize useful coverage rather than repeating one generic query. Search origin/destination pairs independently. Look for current fare pages, flexible-date fare results, airline sales, recently surfaced deal pricing, reputable flight-search results, and relevant current event calendars/official event sources when event timing could add value. When possible verify promising fares through a current flight-search result rather than stale snippets. Pay special attention to shoulder season, midweek departures, newly released inventory, short-notice drops, cheap connection combinations, event weekends, festival dates, and fares far below route norms. For year-round destinations, deliberately inspect off-season months. If a broad query reveals a promising fare or event/date pairing, drill into it before reporting. Use flexible-date calendars/date grids/price graphs when accessible; vary departure dates, return dates, trip lengths, and origin airports; search multiple targeted date windows rather than relying on a single broad web query. Never claim exhaustive coverage unless every combination was actually checked.

Do not fabricate live availability, fares, event dates, or lineups. If a source is stale, say so. Always be transparent about search coverage and limitations. Do not imply access to a private Google Flights/GDS API if none exists.

ALERT POLICY: This is a condition watch, not a daily newsletter. If nothing is genuinely compelling, say so clearly and do not pad the report with ordinary fares. If multiple deals exist, rank the best few (typically 3–8).

FOR EACH ALERT provide:
- destination (city + airport code)
- whether year-round/seasonal
- origin airport
- total ${tripLabel} price/currency and USD equivalent if needed
- exact dates
- trip length (if round-trip)
- airline(s)
- stops
- connection airports if known
- approximate travel time if available
- basic-economy/baggage caveats
- self-transfer warnings
- why the fare is unusually good
- a direct booking/search link when available
- if relevant, the overlapping event/festival/season opportunity, with dates and an official/reliable source

Give each deal a rating: INTERESTING, GOOD, VERY GOOD, EXCELLENT, EXCEPTIONAL, or EXTREME. Identify CHEAPEST OVERALL and BEST VALUE when multiple deals qualify. Add an EVENT JACKPOT label when a strong airfare coincides with an unusually compelling relevant event.

The goal is to find fares cheap enough to plausibly justify an otherwise unplanned spontaneous trip, while still applying intelligent destination-specific seasonality and itinerary quality.
`
}
