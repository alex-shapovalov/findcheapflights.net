import { APP_URL } from './constants'

const MAX_IP_CHARS = 45

export function clientIp(request: Request) {
  const platform = request.headers.get('x-vercel-forwarded-for')
  if (platform) {
    const ip = platform.split(',')[0]?.trim()
    if (ip) return ip.slice(0, MAX_IP_CHARS)
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, MAX_IP_CHARS)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip.slice(0, MAX_IP_CHARS)
  }
  return 'unknown'
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const allowed = new Set<string>()
  if (URL.canParse(APP_URL)) {
    allowed.add(new URL(APP_URL).origin)
  }
  const host = request.headers.get('host')
  if (host) {
    allowed.add(`https://${host}`)
    allowed.add(`http://${host}`)
  }
  return allowed.has(origin)
}
