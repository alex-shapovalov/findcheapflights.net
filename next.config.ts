import type { NextConfig } from 'next'

const clerkHosts = [
  'https://*.clerk.accounts.dev',
  'https://*.clerk.com',
  'https://*.protect.clerk.com',
  'https://clerk.findcheapflights.ai',
  'https://accounts.findcheapflights.ai',
  'https://clerk.findcheapflights.net',
  'https://accounts.findcheapflights.net',
].join(' ')

const googleAnalyticsHosts = [
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
].join(' ')

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkHosts} ${googleAnalyticsHosts} https://challenges.cloudflare.com https://js.stripe.com https://*.js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://img.clerk.com https://*.stripe.com ${googleAnalyticsHosts}`,
  "font-src 'self' data:",
  `connect-src 'self' ${clerkHosts} ${googleAnalyticsHosts} https://clerk-telemetry.com https://*.clerk-telemetry.com https://challenges.cloudflare.com https://api.stripe.com https://*.stripe.com https://*.convex.cloud wss://*.convex.cloud`,
  `frame-src 'self' ${clerkHosts} https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://*.js.stripe.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${clerkHosts}`,
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  trailingSlash: false,
  outputFileTracingIncludes: {
    '/*': ['./content/story/**/*.md', './content/blog/**/*.md'],
  },
  async headers() {
    return [
      {
        source: '/og.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Type', value: 'image/png' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
