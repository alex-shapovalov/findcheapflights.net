import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'History',
  description:
    'Your private fare-hunt history on Find Cheap Flights, including past searches and saved live cheap-fare reports.',
}

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return children
}
