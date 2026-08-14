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
