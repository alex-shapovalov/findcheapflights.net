import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-mute sm:flex-row sm:items-center sm:justify-between">
        <p>
          <Link href="/" className="hover:text-foam">
            findcheapflights.net
          </Link>{' '}
          — find cheap flights with flexible-date fare hunting, not a GDS.
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/" className="hover:text-foam">
            Hunt
          </Link>
          <Link href="/pricing" className="hover:text-foam">
            Pricing
          </Link>
          <Link href="/history" className="hover:text-foam">
            History
          </Link>
        </nav>
      </div>
    </footer>
  )
}
