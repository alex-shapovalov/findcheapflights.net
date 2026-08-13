import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { noIndexMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: 'Sign up',
  description:
    'Create a findcheapflights.net account to subscribe after your free fare hunt.',
}

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children
}
