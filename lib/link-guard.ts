const ALLOWED_DOMAINS = new Set([
  'skyscanner.com',
  'skyscanner.net',
  'kayak.com',
  'momondo.com',
  'expedia.com',
  'booking.com',
  'priceline.com',
  'orbitz.com',
  'travelocity.com',
  'cheapflights.com',
  'cheapoair.com',
  'justfly.com',
  'hopper.com',
  'kiwi.com',
  'trip.com',
  'edreams.com',
  'opodo.com',
  'gotogate.com',
  'mytrip.com',
  'skiplagged.com',
  'dohop.com',
  'itasoftware.com',
  'going.com',
  'secretflying.com',
  'theflightdeal.com',
  'jacksflightclub.com',
  'airfarewatchdog.com',
  'united.com',
  'delta.com',
  'aa.com',
  'southwest.com',
  'jetblue.com',
  'alaskaair.com',
  'spirit.com',
  'flyfrontier.com',
  'hawaiianairlines.com',
  'allegiantair.com',
  'suncountry.com',
  'flybreeze.com',
  'aveloair.com',
  'aircanada.com',
  'westjet.com',
  'flyporter.com',
  'airtransat.com',
  'britishairways.com',
  'virginatlantic.com',
  'lufthansa.com',
  'airfrance.com',
  'klm.com',
  'iberia.com',
  'aireuropa.com',
  'vueling.com',
  'ryanair.com',
  'easyjet.com',
  'wizzair.com',
  'norwegian.com',
  'flynorse.com',
  'flyplay.com',
  'icelandair.com',
  'flytap.com',
  'aerlingus.com',
  'frenchbee.com',
  'condor.com',
  'flysas.com',
  'finnair.com',
  'swiss.com',
  'austrian.com',
  'brusselsairlines.com',
  'ita-airways.com',
  'flylevel.com',
  'eurowings.com',
  'transavia.com',
  'jet2.com',
  'airbaltic.com',
  'airserbia.com',
  'lot.com',
  'aegeanair.com',
  'volotea.com',
  'flypgs.com',
  'sunexpress.com',
  'turkishairlines.com',
  'emirates.com',
  'qatarairways.com',
  'etihad.com',
  'flydubai.com',
  'saudia.com',
  'singaporeair.com',
  'cathaypacific.com',
  'koreanair.com',
  'zipair.net',
  'airindia.com',
  'vietnamairlines.com',
  'thaiairways.com',
  'malaysiaairlines.com',
  'airasia.com',
  'flyscoot.com',
  'evaair.com',
  'philippineairlines.com',
  'qantas.com',
  'virginaustralia.com',
  'airnewzealand.com',
  'jetstar.com',
  'fijiairways.com',
  'copaair.com',
  'avianca.com',
  'latamairlines.com',
  'aeromexico.com',
  'volaris.com',
  'vivaaerobus.com',
  'ethiopianairlines.com',
  'royalairmaroc.com',
  'egyptair.com',
  'elal.com',
])

const ALLOWED_EXACT_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'flights.google.com',
])

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  if (ALLOWED_EXACT_HOSTS.has(host)) return true
  const bare = host.startsWith('www.') ? host.slice(4) : host
  if (ALLOWED_DOMAINS.has(bare)) return true
  for (const domain of ALLOWED_DOMAINS) {
    if (bare.endsWith(`.${domain}`)) return true
  }
  return false
}

export function safeExternalUrl(value: string | undefined) {
  if (!value) return undefined
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return undefined
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return undefined
  }
  if (parsed.username || parsed.password) return undefined
  return isAllowedHost(parsed.hostname) ? value : undefined
}

const MARKETING_PATH =
  /flights-from-[a-z]|flights-to-[a-z]|flight-routes|\/destinations\/|\/explore\/|\/inspire\/|\/anywhere\/|transport\/flights-from\//i

const REGION_PATH =
  /(?:^|\/)(?:europe|asia|africa|oceania|worldwide|international|south-america|north-america|anywhere)(?:\/|$|\.)|\/zz[a-z]{2}/i

export function isMarketingBrowseUrl(value: string) {
  try {
    const parsed = new URL(value)
    const path = parsed.pathname
    if (MARKETING_PATH.test(path)) return true
    if (REGION_PATH.test(path)) return true
    if (/\/routes\/[a-z0-9]{3}\/[a-z0-9]{3}\/?$/i.test(path)) return true
    if (
      /\/transport\/flights\/[a-z]{3}\/(?:anywhere|[a-z]{3})\/?$/i.test(path)
    ) {
      return true
    }
    if (/\/flights\/[a-z]{3}-[a-z]{3}\/?$/i.test(path)) return true
    if (/\/travel\/flights\/?$/i.test(path) && !parsed.search && !parsed.hash) {
      return true
    }
    return false
  } catch {
    return true
  }
}

export function isGenericBrowseUrl(value: string) {
  return isMarketingBrowseUrl(value)
}

export function isSelectedFareUrl(value: string) {
  try {
    const parsed = new URL(value)
    if (isMarketingBrowseUrl(value)) return false
    const path = parsed.pathname.toLowerCase()
    const host = parsed.hostname.toLowerCase()
    const query = parsed.search.toLowerCase()

    if (host.includes('google.') || host === 'flights.google.com') {
      return (
        path.includes('/travel/flights/booking') ||
        parsed.searchParams.has('tfu')
      )
    }

    if (host.includes('skyscanner.')) {
      return /\/config\/[a-z0-9-]+/i.test(path)
    }

    if (/kayak\.|momondo\.|cheapflights\./.test(host)) {
      if (/\/book\b|\/checkout|\/pass\b/.test(path)) return true
      return /\/flights\/[a-z]{3}-[a-z]{3}\/\d{4}-\d{2}-\d{2}(?:\/\d{4}-\d{2}-\d{2})?\/[a-z0-9]{6,}/i.test(
        path,
      )
    }

    if (/expedia\.|orbitz\.|travelocity\./.test(host)) {
      return /flight-information|checkout|tripid|offerid/i.test(
        `${path}${query}`,
      )
    }

    if (host.includes('priceline.')) {
      return /\/book|\/checkout|itinerary|offer/i.test(`${path}${query}`)
    }

    if (/\/(checkout|itinerary|config|cart|purchase|order)\b/i.test(path)) {
      return true
    }

    const keys = [...parsed.searchParams.keys()].join(',')
    return (
      /(itinerary|offerid|offer_id|resultid|flightkey|bookingid|tfu)/i.test(
        keys,
      ) && parsed.search.length > 40
    )
  } catch {
    return false
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const DATE_IN_URL =
  /(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|(?:19|20)\d{6}|\/\d{6}(?=\/|$)/

export function isDatedItineraryUrl(value: string) {
  try {
    if (isMarketingBrowseUrl(value)) return false
    if (isSelectedFareUrl(value)) return true
    const parsed = new URL(value)
    const hay = `${parsed.pathname}${parsed.search}${parsed.hash}`
    if (DATE_IN_URL.test(hay)) return true
    return parsed.searchParams.has('tfs') || parsed.searchParams.has('q')
  } catch {
    return false
  }
}

export function safeFareUrl(value: string | undefined) {
  const url = safeExternalUrl(value)
  if (!url || isMarketingBrowseUrl(url)) return undefined
  return url
}

export function safeBookingUrl(value: string | undefined) {
  const url = safeFareUrl(value)
  if (!url || !isDatedItineraryUrl(url)) return undefined
  return url
}

export function itinerarySearchUrl(input: {
  originAirport?: string
  destinationAirport?: string
  departDate?: string
  returnDate?: string | null
  airlines?: string[]
  stops?: number | null
}) {
  const origin = input.originAirport?.toUpperCase()
  const dest = input.destinationAirport?.toUpperCase()
  const depart = input.departDate
  if (!origin || !dest || !depart || !ISO_DATE.test(depart)) return undefined
  const ret = input.returnDate ?? undefined
  if (ret && !ISO_DATE.test(ret)) return undefined

  const query = [
    input.returnDate ? '' : 'One way',
    `Flights from ${origin} to ${dest} on ${depart}`,
    ret ? `through ${ret}` : '',
    ...(input.airlines ?? []).filter(Boolean),
    input.stops === 0 ? 'nonstop' : '',
    input.stops === 1 ? '1 stop' : '',
    input.stops != null && input.stops >= 2 ? `${input.stops} stops` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `https://www.google.com/travel/flights?hl=en-US&curr=USD&q=${encodeURIComponent(query)}`
}
