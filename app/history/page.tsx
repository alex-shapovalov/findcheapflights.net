'use client'

import { useQuery } from 'convex/react'
import Link from 'next/link'
import { api } from '@/convex/_generated/api'
import { travelThemeLabel } from '@/lib/constants'

export default function HistoryPage() {
  const searches = useQuery(api.searches.listMine)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl">Past hunts</h1>
      <p className="mt-2 text-mute">
        Your fare reports stay here after the stream finishes.
      </p>
      <div className="mt-8 space-y-3">
        {searches === undefined && <p className="text-mute">Loading...</p>}
        {searches?.length === 0 && (
          <p className="text-mute">No searches yet.</p>
        )}
        {searches?.map(search => {
          const themeLabel = travelThemeLabel(search.interests)
          return (
            <Link
              key={search._id}
              href={`/history/${search._id}`}
              className="block rounded-2xl border border-line bg-panel px-4 py-4 hover:border-gold"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="wrap-break-word font-medium">
                  {search.mode === 'flexible_destination'
                    ? `${search.originAirports.join(', ')} → ${search.continent}`
                    : `${search.originAirports.join(', ')} → ${search.destinationAirports.join(', ')}`}
                </p>
                <span className="text-xs uppercase tracking-[0.16em] text-mute">
                  {search.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-mute">
                {search.tripType.replace('_', ' ')}
                {search.maxPrice != null ? ` · max $${search.maxPrice}` : ''}
                {themeLabel ? ` · ${themeLabel}` : ''}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
