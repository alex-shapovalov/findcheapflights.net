'use client'

import { useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { SearchReport } from '@/components/search-report'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const search = useQuery(api.searches.getMine, {
    id: params.id as Id<'searches'>,
  })

  if (search === undefined) {
    return <p className="px-4 py-16 text-mute">Loading...</p>
  }
  if (!search) {
    return <p className="px-4 py-16 text-mute">Search not found.</p>
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">
        {search.status}
      </p>
      <h1 className="mt-2 font-display text-4xl">
        {search.mode === 'flexible_destination'
          ? `${search.originAirports.join(', ')} → ${search.continent}`
          : `${search.originAirports.join(', ')} → ${search.destinationAirports.join(', ')}`}
      </h1>
      {search.error && <p className="mt-4 text-danger">{search.error}</p>}
      <div className="mt-8">
        <SearchReport text={search.result ?? ''} />
      </div>
    </div>
  )
}
