import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Sign Up',
  description:
    'Create a Find Cheap Flights account to subscribe after your free fare hunt and keep searching live cheap fares.',
}

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children
}
