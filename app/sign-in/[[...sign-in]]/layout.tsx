import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Sign in',
  description: 'Sign in to findcheapflights.net to hunt live cheap fares.',
}

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children
}
