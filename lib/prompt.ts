import {
  describeAirports,
  formatAirport,
  getAirport,
  nearbyAirports,
} from './airports'
import {
  NEARBY_DRIVE_HOURS_DEFAULT,
  nearbyRadiusKm,
  SEARCH_HORIZON_MONTHS,
  type TravelThemeId,
} from './constants'
import type { SearchRequest } from './types'

const THEME_PROMPTS: Record<TravelThemeId, string> = {
  electronic:
    'electronic music, club nights, warehouse parties, and EDM/techno festivals',
  concerts: 'concerts, arena and stadium tours, and live music festivals',
  nightlife: 'nightlife, bar districts, and late-night city scenes',
  cities: 'major cities, architecture, art galleries, and museums',
  food: 'regional food scenes, markets, wine regions, and vineyard country',
  beaches: 'beaches, islands, and warm coastal towns',
  diving: 'scuba diving, snorkeling, reefs, and clear-water coastlines',
  surf: 'surf breaks and surf towns',
  ski: 'skiing, snowboarding, and alpine resort towns',
  hiking: 'hiking, national parks, mountains, and the outdoors',
  sport: 'live sport — football/soccer matches, motorsport, and major fixtures',
  markets: 'Christmas markets and winter holiday festivities',
  wellness: 'spas, thermal baths, and wellness retreats',
}

function priceLine(minPrice?: number, maxPrice?: number) {
  if (minPrice != null && maxPrice != null) {
    return `Prefer currently bookable fares between $${minPrice} and $${maxPrice} USD. If none exist in that band, still return the closest live fares you found, mark aboveRequestedCap true when they sit outside the band, and say so in the summary. Never omit deals because they missed the band.`
  }
  if (maxPrice != null) {
    return `Prefer currently bookable fares at or below $${maxPrice} USD. If nothing under that cap is live today, still return the cheapest bookable fares you found, closest to $${maxPrice} first, set aboveRequestedCap true, and explain the gap. Never return zero deals.`
  }
  if (minPrice != null) {
    return `Ignore junk/impossible fares below $${minPrice} USD unless you can verify they are real, bookable, and not a mistake/scrape error. Always return the cheapest live fares you did find.`
  }
  return 'Use destination-aware deal thresholds. For transatlantic leisure trips, mainland/major European cities are generally interesting at <=$400, strongly prioritized at <=$350, exceptional at <=$300. Beach/island seasonal destinations may justify a higher bar. Adjust judgment for destination, season, historical norms, itinerary quality, and any event value. Even when nothing looks like a steal, still return the cheapest live fares you found.'
}

function dateLine(input: SearchRequest, today: string, horizon: string) {
  const parts: string[] = []
  if (input.dateFrom && input.dateTo) {
    parts.push(`Search travel from ${input.dateFrom} through ${input.dateTo}.`)
  } else if (input.dateFrom) {
    parts.push(
      `Search from ${input.dateFrom} through ${horizon}, covering the full window rather than only the first few weeks.`,
    )
  } else if (input.dateTo) {
    parts.push(`Search from ${today} through ${input.dateTo}.`)
  } else {
    parts.push(
      `SEARCH HORIZON: No dates were given, so search forward roughly one to two years — from ${today} through ${horizon} — and treat that whole window as in scope.`,
      'Deliberately sample multiple seasons and several months across that horizon instead of only the next few weeks. Newly opened schedules 6–18 months out are often where the cheapest inventory sits.',
    )
  }
  parts.push(
    `Never report travel dates before ${today}. Any fare, article, or snippet describing dates that have already passed is stale: either re-verify current pricing for future dates or leave it out.`,
  )
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
  const driveHours = input.driveHours ?? NEARBY_DRIVE_HOURS_DEFAULT
  const extras = nearbyAirports(
    input.originAirports,
    nearbyRadiusKm(driveHours),
  )
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
      ? `Airports within roughly a ${driveHours}-hour drive that may also be worth a look if the user-selected set is sparse: ${extras.join(', ')}. Prefer the user-selected origins; only use extras when they produce a clearly better deal.`
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

function interestsBlock(theme?: TravelThemeId) {
  const text = theme ? THEME_PROMPTS[theme] : undefined
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

function requiredSkyscannerUrls(input: SearchRequest) {
  const origins = [
    ...new Set(input.originAirports.map(code => code.toLowerCase())),
  ].slice(0, 4)
  if (input.mode === 'flexible_origin') {
    const dests = [
      ...new Set(input.destinationAirports.map(code => code.toLowerCase())),
    ].slice(0, 4)
    return origins.flatMap(origin =>
      dests.flatMap(dest => [
        `https://www.skyscanner.com/transport/flights/${origin}/${dest}/`,
        `https://www.skyscanner.com/routes/${origin}/${dest}/`,
      ]),
    )
  }
  return origins.flatMap(origin => [
    `https://www.skyscanner.com/transport/flights/${origin}/anywhere/`,
    `https://www.skyscanner.com/transport/flights-from/${origin}/`,
  ])
}

function horizonDate(now: Date) {
  const horizon = new Date(now)
  horizon.setMonth(horizon.getMonth() + SEARCH_HORIZON_MONTHS)
  return horizon.toISOString().slice(0, 10)
}

export function buildFlightHuntPrompt(input: SearchRequest, now: Date) {
  const tripLabel = input.tripType === 'one_way' ? 'one-way' : 'round-trip'
  const cabin = 'economy'
  const today = now.toISOString().slice(0, 10)
  const horizon = horizonDate(now)
  const fetchUrls = requiredSkyscannerUrls(input)
    .slice(0, 10)
    .map(url => `- ${url}`)
    .join('\n')

  return `Act as an aggressive flexible-date airfare deal hunter for spontaneous leisure trips. Search current ${tripLabel} ${cabin} fares using live/publicly accessible flight-search and airline information whenever possible. Today is ${today}.

HARD URL LAW: Every deal must include a Google Flights bookingUrl that you fetched and on which you saw this itinerary's price. Always prefer a copied Google /booking?tfs=&tfu= href. If you cannot match the flight and price on that Google Flights page, this is not a verified deal and you must find a different deal. All deals must be accompanied by an actual direct link so the user can click it and see the deal exactly as you saw it. Never null.

VISIT AND CONFIRM: Before you emit a deal, you MUST open a dated Google Flights page for THIS origin, destination, and dates with the page-fetch tool and read the body. A constructed Google Flights URL is not enough. You must see a visible dollar (or converted) price on that page for this itinerary. priceUsd must be that number — not a Skyscanner card, not a blog recap, not a remembered fare. If Google Flights shows a different price, change the deal to match Google Flights or drop it. If the fetch fails, the page is a JS shell with no fares, or you cannot see this itinerary and price, set verifiedLive false, warn that Google Flights did not show the fare, and prefer a different deal you can actually read. verifiedLive is true only after that Google Flights fetch showed this origin, destination, dates, and price. Do not mark verified from a snippet, a memory, Kayak, Skyscanner, or a URL you did not open.

${originBlock(input)}

${interestsBlock(input.interests)}

${destinationBlock(input)}

${dateLine(input, today, horizon)}

TRIP TYPE: ${tripLabel === 'one-way' ? 'One-way only. Do not report round-trip bundles as if they were one-way fares.' : 'Round-trip. Report total round-trip price, exact outbound and return dates, and trip length in nights.'}

DEAL THRESHOLDS: ${priceLine(input.minPrice, input.maxPrice)}

ITINERARY QUALITY: One-stop protected itineraries are the default hunt, not a fallback. Most of the cheapest transatlantic and leisure fares connect once (Norse, PLAY, Icelandair, French Bee, TAP, Aer Lingus, Air Europa, and similar). Search 1-stop first, then nonstop, then 2-stop when it is materially cheaper. Never hide a cheap 1-stop because a nonstop exists at a higher fare. Economy/basic economy is acceptable but label basic economy and meaningful baggage restrictions. Clearly flag self-transfers, separate tickets, airport changes, overnight layovers, or risky connections. Do not recommend an absurd itinerary to save a trivial amount.

CHEAPEST-ON-PAGE RULE: You must have fetched the Google Flights bookingUrl in this run. That page must show this origin, destination, dates, and a price. priceUsd must be a fare you actually read on that Google Flights page for this itinerary — not a different cheapest row, not a price from another site. Prefer a copied /booking?tfs=&tfu= href when the page exposes one. Do not pick a convenient mid-list itinerary when a cheaper 1-stop sits above it.

SOURCES: Fetch these Skyscanner pages first with the page-fetch tool, before Google Flights or Expedia:
${fetchUrls}
Those listings (especially the routes / cheap-flights HTML pages) contain the "from £/$" cards. They are often GBP or EUR — convert to USD. A "from £153" card is usually one-way; the same page often states a return-from price in the header. For a round-trip hunt, do not discard those cards: take the cheap outbound date, add a return in the requested night range, then verify that dated round-trip on Google Flights. Interactive Skyscanner/Expedia day views are JS-heavy and often hide the cheap inventory from a raw fetch — do not stop at the first Expedia "Best" result.

GOOGLE FLIGHTS PRICE LOCK: Discovery can start on Skyscanner, Kayak, or an airline. Every deal you emit must then be checked on Google Flights. Fetch a dated Google Flights URL (prefer /travel/flights/booking?tfs=&tfu= if you copied one; otherwise the dated /travel/flights?q= search for this origin, destination, and dates). Read the fetched HTML. You must observe a fare amount on that page. Set priceUsd to the Google Flights number you saw. Set bookingUrl to that Google Flights href. Set sourceUrl to the page where you first found the lead, plus keep the Google Flights href as bookingUrl. If Google Flights does not display a price for this itinerary, do not invent one and do not mark verifiedLive true.

SEARCH STRATEGY: On each run, maximize useful coverage rather than repeating one generic query. Search origin/destination pairs independently, including 1-stop connecting cities, not just nonstop. Look for current fare pages, flexible-date fare results, airline sales, recently surfaced deal pricing, reputable flight-search results, and relevant current event calendars/official event sources when event timing could add value. When possible verify promising fares through a current flight-search result rather than stale snippets. Pay special attention to shoulder season, midweek departures, newly released inventory, short-notice drops, cheap connection combinations, event weekends, festival dates, and fares far below route norms. For year-round destinations, deliberately inspect off-season months. If a broad query reveals a promising fare or event/date pairing, drill into it before reporting. Use flexible-date calendars/date grids/price graphs when accessible; vary departure dates, return dates, trip lengths, and origin airports; search multiple targeted date windows rather than relying on a single broad web query. Never claim exhaustive coverage unless every combination was actually checked. If Skyscanner shows a cluster of sub-£300 / sub-$400 1-stops and you are about to report $600+ only, you missed the cheap inventory — go back and price those dates as ${tripLabel} before finishing.

Do not fabricate live availability, fares, event dates, lineups, airport codes, or URLs. If a source is stale, leave it out of deals. Do not imply access to a private Google Flights/GDS API if none exists. Do not write travel-advice, price-alert, packing, or coverage-caveat sections.

FARE URL CONTRACT: bookingUrl is required and should be the Google Flights page you fetched. Best is a copied /booking?tfs=&tfu= href. Good enough is a dated Google Flights search for THIS itinerary that you opened and on which you saw the price. Emitting the URL without reading a price on that page is a contract break. Null is wrong.

BEST (copy, do not invent ids):
- https://www.google.com/travel/flights/booking?tfs=...&tfu=...
- https://www.skyscanner.com/transport/flights/mco/yeaa/261113/config/13933-2611130850--32385-1-18102-2611131655?...

GOOD ENOUGH (always emit one of these if you lack a token):
- https://www.google.com/travel/flights?q=Flights%20from%20CLT%20to%20LHR%20on%202026-10-14%20through%202026-10-21%20American%20Airlines%201%20stop
- https://www.kayak.com/flights/CLT-LHR/2026-10-14/2026-10-21
- https://www.skyscanner.com/transport/flights/clt/lhr/261014/261021/

INVALID (NEVER USE):
- https://www.cheapflights.com/flights-to-europe/atlanta/
- https://www.priceline.com/flight-routes/en-us/ATL/ZZEU00/flights-from-atlanta-to-europe.ssp
- https://flynorse.com/en-US/flights-from-New-York-to-Rome
- any /flights-from-*, /flights-to-*, /flight-routes/*, continent, or date-less browse page

sourceUrl may be the page where you first saw the price.

ALSO CHECKED URL CONTRACT: sourceUrl is required on every alsoChecked item. Best is the recap or search page you fetched. Good enough is a Google URL for that route. Null is wrong. Never list a route you cannot link. Must match your deal.

ALERT POLICY: Always return deals. Rank 6-8 of the closest currently bookable fares, cheapest first. Prefer fares under the traveler's cap when they exist. If the cap cannot be met, still put the nearest live prices in deals, set aboveRequestedCap, and say they missed the target. Expired blog posts, stale 2025 pages, and recaps go in alsoChecked, not deals. Never write a report whose conclusion is that there is nothing to show.

*EXTREMELY IMPORTANT* OUTPUT CONTRACT: ALWAYS return a single JSON object and nothing else (ONLY JSON) — no markdown, no code fences, no commentary before or after it. Every string field must be plain prose, with no markdown syntax, tables, headings, or bullet characters.

Field meanings:
- headline: one-line verdict, at most 90 characters. Name a fare, not an empty result.
- verdict: "deals_found" when at least one deal is at or under the requested cap, or no cap was set. "nothing_compelling" only when every deal is above the cap — still include those closest fares in deals.
- summary: 2–5 sentences of honest context, including what the price landscape looks like for this origin set.
- deals: 3–8 currently bookable fares, cheapest first. Never an empty array. If nothing meets the cap, these are the closest live fares you found; set aboveRequestedCap true and justify the miss in whyGood. Do not put expired or unbookable recaps here.
- deals[].originAirport: exactly one 3-letter IATA code for the departure airport, uppercase, for example "TPA". Never a city name, never a sentence, never null when you know the airport.
- deals[].destinationAirport: exactly one 3-letter IATA code for the arrival airport, uppercase, for example "KEF". Never a city name, never a sentence.
- deals[].destinationCity: city name only, for example "Reykjavik". Do not put the IATA code here.
- deals[].priceUsd: total per-traveler price in USD for the entire ${tripLabel} itinerary. Never pass a one-way price off as a round trip.
- deals[].departDate, returnDate, nights: exact dates as YYYY-MM-DD; returnDate and nights are null for one-way.
- deals[].airlines, stops, connections, travelTime: itinerary facts. Use null or an empty array when unknown instead of guessing.
- deals[].fareBrand, baggage: label basic economy and any meaningful baggage restriction. If unknown, use null — do not invent restrictions.
- deals[].warnings: self-transfers, separate tickets, airport changes, overnight layovers, risky connections, or pricing you could not confirm.
- deals[].rating: INTERESTING, GOOD, VERY_GOOD, EXCELLENT, EXCEPTIONAL, or EXTREME.
- deals[].labels: add CHEAPEST_OVERALL and BEST_VALUE when several deals qualify, and EVENT_JACKPOT when a strong fare lands on an unusually compelling relevant event.
- deals[].bookingUrl: required. The Google Flights href you fetched for this itinerary. Prefer a copied /booking?tfs=&tfu= link. Otherwise a dated Google Flights search for THIS origin, destination, and dates. You must fetch this href and see the price before reporting. Never null. Never a marketing page.
- deals[].sourceUrl: page where you first saw the lead, or the same Google Flights href. Never a marketing page.
- deals[].verifiedLive: true only after you fetched the Google Flights bookingUrl in this run and that page showed this origin, destination, dates, and the same priceUsd. False if you only built the URL, the page had no fares, or the price came from another site.
- deals[].event: the overlapping event with dates and an official source, or null. Set separateTicket when the event needs its own ticket.
- alsoChecked: expired recaps, stale pages, and routes that were not close enough to list as deals. Never an item without sourceUrl.
- alsoChecked[].sourceUrl: required. The recap, stale page, or Google URL for this route. You must fetch this href before reporting. Never null. Never a marketing page. Must match your deal.
Do not include recommendations, next steps, price-alert advice, or coverage/caveats fields. Put itinerary risks on deals[].warnings only.

The goal is to find fares cheap enough to plausibly justify an otherwise unplanned spontaneous trip, while still applying intelligent destination-specific seasonality and itinerary quality. Never hallucinate facts, prices, dates, or links.

AGAIN: fetch every Google Flights bookingUrl and report the price that page actually showed. Never mark verifiedLive because a URL looks correct. The price must be on the fetched Google Flights page. ALWAYS FOLLOW THE JSON SCHEMA OR THE CONTRACT BREAKS.
`
}
