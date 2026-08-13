import type { NextConfig } from 'next'

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://*.js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com https://*.stripe.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com https://*.stripe.com https://*.convex.cloud wss://*.convex.cloud",
  'frame-src https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://hooks.stripe.com https://*.js.stripe.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const noIndexHeader = {
  key: 'X-Robots-Tag',
  value: 'noindex, nofollow',
}

const nextConfig: NextConfig = {
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.findcheapflights.net' }],
        destination: 'https://findcheapflights.net/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [noIndexHeader],
      },
      {
        source: '/history',
        headers: [noIndexHeader],
      },
      {
        source: '/history/:path*',
        headers: [noIndexHeader],
      },
      {
        source: '/sign-in',
        headers: [noIndexHeader],
      },
      {
        source: '/sign-in/:path*',
        headers: [noIndexHeader],
      },
      {
        source: '/sign-up',
        headers: [noIndexHeader],
      },
      {
        source: '/sign-up/:path*',
        headers: [noIndexHeader],
      },
      {
        source: '/success',
        headers: [noIndexHeader],
      },
    ]
  },
}

export default nextConfig
