import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Sign In',
  description:
    'Sign in to Find Cheap Flights to hunt live cheap fares from nearby airports or to a city you already want.',
}

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children
}
