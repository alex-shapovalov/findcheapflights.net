import type { Metadata } from 'next'
import Link from 'next/link'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Page not found',
  description: 'This page does not exist on findcheapflights.ai.',
}

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-20">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">404</p>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl">
        Page not found.
      </h1>
      <p className="mt-4 text-mute">
        That URL is not a cheap-flight hunt we know about.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-gold px-6 py-3 font-medium text-on-gold"
      >
        Find cheap flights
      </Link>
    </div>
  )
}
